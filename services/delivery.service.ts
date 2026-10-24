import "server-only";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { ROLES } from "@/lib/auth/permissions";
import { AuditService } from "@/services/audit.service";
import { OrderService } from "@/services/order.service";

const ASSIGNABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.PACKED,
];

const orderInclude = {
  customer: { include: { user: { select: { name: true, phone: true } } } },
  items: { include: { product: { select: { name: true, unitType: true } } } },
  payments: { select: { method: true, status: true } },
} as const;

/** Active employees holding the DELIVERY_STAFF role. */
export async function listDeliveryAgents() {
  return db.employee.findMany({
    where: {
      isActive: true,
      user: { isActive: true, userRoles: { some: { role: { name: ROLES.DELIVERY_STAFF } } } },
    },
    select: { id: true, user: { select: { name: true, phone: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

/** Orders that still need an agent, or whose agent can still be changed (not yet collected). */
export async function listOrdersAwaitingAssignment() {
  return db.order.findMany({
    where: {
      orderStatus: { in: ASSIGNABLE_ORDER_STATUSES },
    },
    include: {
      ...orderInclude,
      delivery: {
        include: { driver: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function assignDeliveryAgent(actorId: string, orderId: string, driverId: string) {
  const [order, driver] = await Promise.all([
    db.order.findUnique({ where: { id: orderId }, include: { delivery: true } }),
    db.employee.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        isActive: true,
        user: {
          select: {
            name: true,
            isActive: true,
            userRoles: { select: { role: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  if (!order) throw new ServiceError("ORDER_NOT_FOUND", "Order not found", 404);
  if (!ASSIGNABLE_ORDER_STATUSES.includes(order.orderStatus)) {
    throw new ServiceError(
      "ORDER_NOT_ASSIGNABLE",
      "Only confirmed, processing or packed orders can be assigned to an agent.",
      409,
    );
  }
  if (order.delivery && order.delivery.status === DeliveryStatus.PICKED_UP) {
    throw new ServiceError("ALREADY_COLLECTED", "The agent has already collected this order.", 409);
  }
  if (
    !driver ||
    !driver.isActive ||
    !driver.user.isActive ||
    !driver.user.userRoles.some(({ role }) => role.name === ROLES.DELIVERY_STAFF)
  ) {
    throw new ServiceError("INVALID_AGENT", "Choose an active delivery agent.", 400, "driverId");
  }

  const previousDriverId = order.delivery?.driverId ?? null;
  await db.$transaction(async (tx) => {
    await tx.delivery.upsert({
      where: { orderId },
      create: {
        orderId,
        driverId,
        status: DeliveryStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      update: { driverId, status: DeliveryStatus.ASSIGNED, assignedAt: new Date() },
    });
    await AuditService.logEvent(
      {
        actorId,
        action: "DELIVERY_ASSIGNED",
        entityType: "ORDER",
        entityId: orderId,
        oldState: { driverId: previousDriverId },
        newState: { driverId, driverName: driver.user.name },
      },
      tx,
    );
  });
}

/** Resolves the employee row for a signed-in delivery agent. */
async function getAgentEmployee(userId: string) {
  const employee = await db.employee.findUnique({
    where: { userId },
    select: { id: true, isActive: true },
  });
  if (!employee || !employee.isActive) {
    throw new ServiceError("NOT_AN_AGENT", "No active delivery profile found for this account.", 403);
  }
  return employee;
}

/** The order must be assigned to this agent, otherwise they may not touch it. */
async function getOwnedOrder(userId: string, orderId: string) {
  const employee = await getAgentEmployee(userId);
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });
  if (!order || order.delivery?.driverId !== employee.id) {
    throw new ServiceError("FORBIDDEN", "This order is not assigned to you.", 403);
  }
  return order;
}

/** Agent collects the packed order from the warehouse: stock moves into their custody. */
export async function collectOrder(userId: string, orderId: string) {
  const order = await getOwnedOrder(userId, orderId);
  if (order.orderStatus !== OrderStatus.PACKED) {
    throw new ServiceError("NOT_READY", "This order is not packed and ready for collection yet.", 409);
  }
  return OrderService.updateOrderStatus(
    orderId,
    OrderStatus.OUT_FOR_DELIVERY,
    "Collected by delivery agent",
    userId,
  );
}

/** Agent confirms the customer received the order. */
export async function markDelivered(userId: string, orderId: string, notes?: string) {
  const order = await getOwnedOrder(userId, orderId);
  if (order.orderStatus !== OrderStatus.OUT_FOR_DELIVERY) {
    throw new ServiceError("NOT_COLLECTED", "Collect the order before marking it delivered.", 409);
  }
  const result = await OrderService.updateOrderStatus(
    orderId,
    OrderStatus.DELIVERED,
    notes?.trim() || "Delivered to customer by delivery agent",
    userId,
  );
  if (notes?.trim()) {
    await db.delivery.update({
      where: { orderId },
      data: { deliveryNotes: notes.trim().slice(0, 255) },
    });
  }
  return result;
}

/** Everything the agent sees: their open orders, recent deliveries, and the stock they hold. */
export async function getAgentDashboard(userId: string) {
  const employee = await db.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!employee) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [active, recent, holdings, deliveredToday, deliveredTotal] = await Promise.all([
    db.order.findMany({
      where: {
        delivery: { driverId: employee.id },
        orderStatus: { in: [OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY] },
      },
      include: { ...orderInclude, delivery: true },
      orderBy: { createdAt: "asc" },
    }),
    db.order.findMany({
      where: { delivery: { driverId: employee.id }, orderStatus: OrderStatus.DELIVERED },
      include: { ...orderInclude, delivery: true },
      orderBy: { delivery: { deliveredAt: "desc" } },
      take: 10,
    }),
    db.driverStock.findMany({
      where: { driverId: employee.id, quantity: { gt: 0 } },
      include: { inventoryItem: { select: { itemName: true, unit: true } } },
      orderBy: { inventoryItem: { itemName: "asc" } },
    }),
    db.delivery.count({
      where: {
        driverId: employee.id,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: startOfDay },
      },
    }),
    db.delivery.count({ where: { driverId: employee.id, status: DeliveryStatus.DELIVERED } }),
  ]);

  return { active, recent, holdings, deliveredToday, deliveredTotal };
}

/** Per-agent report for admins: workload, stock in hand and what each has delivered. */
export async function getAgentSummaries() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const agents = await db.employee.findMany({
    where: { user: { userRoles: { some: { role: { name: ROLES.DELIVERY_STAFF } } } } },
    select: {
      id: true,
      isActive: true,
      user: { select: { name: true, phone: true } },
      driverStock: {
        where: { quantity: { gt: 0 } },
        select: { quantity: true, inventoryItem: { select: { itemName: true, unit: true } } },
      },
      deliveries: {
        select: {
          status: true,
          deliveredAt: true,
          order: { select: { totalAmount: true } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return agents.map((agent) => {
    const count = (status: DeliveryStatus) =>
      agent.deliveries.filter((d) => d.status === status).length;
    const delivered = agent.deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED);
    return {
      id: agent.id,
      name: agent.user.name,
      phone: agent.user.phone,
      isActive: agent.isActive,
      assigned: count(DeliveryStatus.ASSIGNED),
      inTransit: count(DeliveryStatus.PICKED_UP),
      deliveredToday: delivered.filter((d) => d.deliveredAt && d.deliveredAt >= startOfDay).length,
      deliveredTotal: delivered.length,
      deliveredValue: delivered.reduce((sum, d) => sum + Number(d.order.totalAmount), 0),
      holdings: agent.driverStock.map((h) => ({
        name: h.inventoryItem.itemName,
        unit: h.inventoryItem.unit,
        quantity: Number(h.quantity),
      })),
    };
  });
}
