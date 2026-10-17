import "server-only";
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod, InventoryTxType } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { AuditService } from "@/services/audit.service";
import type { CheckoutInput, DeliveryAddressInput } from "@/lib/validations/order";

export class OrderService {
  /**
   * Places an order atomically with MariaDB transaction:
   * verifies stock, reserves stock, creates order & order items, logs status history.
   */
  static async createOrder(
    userId: string,
    input: CheckoutInput,
    actorId?: string,
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Resolve Customer profile
      let customer = await tx.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: { userId },
        });
      }

      // 2. Resolve Delivery Address
      let deliveryAddressData: Record<string, unknown>;

      if (input.addressId) {
        const address = await tx.customerAddress.findFirst({
          where: { id: input.addressId, customerId: customer.id },
        });
        if (!address) {
          throw new ServiceError("ADDRESS_NOT_FOUND", "Saved address not found", 404);
        }
        deliveryAddressData = {
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          addressType: address.addressType,
        };
      } else if (input.newAddress) {
        if (input.newAddress.isDefault) {
          await tx.customerAddress.updateMany({
            where: { customerId: customer.id },
            data: { isDefault: false },
          });
        }
        const saved = await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            recipientName: input.newAddress.recipientName,
            recipientPhone: input.newAddress.recipientPhone,
            addressLine1: input.newAddress.addressLine1,
            addressLine2: input.newAddress.addressLine2,
            city: input.newAddress.city,
            state: input.newAddress.state,
            pincode: input.newAddress.pincode,
            addressType: input.newAddress.addressType,
            isDefault: input.newAddress.isDefault,
          },
        });
        deliveryAddressData = {
          recipientName: saved.recipientName,
          recipientPhone: saved.recipientPhone,
          addressLine1: saved.addressLine1,
          addressLine2: saved.addressLine2,
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
          addressType: saved.addressType,
        };
      } else {
        throw new ServiceError("MISSING_ADDRESS", "Please provide a delivery address", 400);
      }

      // 3. Process each cart item, check stock & prices
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
          pricingTiers: true,
          inventoryItem: true,
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const orderItemsToCreate: Array<{
        productId: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
      }> = [];

      const stockReservations: Array<{
        inventoryItemId: string;
        quantity: number;
        productName: string;
      }> = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new ServiceError("PRODUCT_NOT_FOUND", `Product not found: ${item.productId}`, 404);
        }

        if (product.status === "ARCHIVED" || product.status === "DRAFT") {
          throw new ServiceError(
            "PRODUCT_UNAVAILABLE",
            `Product "${product.name}" is no longer available.`,
            400,
          );
        }

        // Check stock availability
        if (product.inventoryItem) {
          const availableStock = Number(product.inventoryItem.availableStock);
          const reservedStock = Number(product.inventoryItem.reservedStock);
          const sellable = availableStock - reservedStock;

          if (!product.allowBackorder && sellable < item.quantity) {
            throw new ServiceError(
              "INSUFFICIENT_STOCK",
              `Only ${Math.max(0, sellable)} ${product.unitType} of "${product.name}" available.`,
              400,
            );
          }

          stockReservations.push({
            inventoryItemId: product.inventoryItem.id,
            quantity: item.quantity,
            productName: product.name,
          });
        }

        // Determine price (check B2B pricing tier)
        let unitPrice = Number(product.retailPrice);
        if (customer.customerType !== "RETAIL" && product.pricingTiers.length > 0) {
          const tier = product.pricingTiers.find(
            (t) => t.customerType === customer.customerType && Number(t.minQty) <= item.quantity,
          );
          if (tier) {
            unitPrice = Number(tier.price);
          }
        }

        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += lineTotal;

        orderItemsToCreate.push({
          productId: product.id,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(unitPrice),
          totalPrice: new Prisma.Decimal(lineTotal),
        });
      }

      // 4. Calculate Delivery Fee & Final Total
      const deliveryFee = subtotal >= 500 ? 0 : 50;
      const totalAmount = subtotal + deliveryFee;

      // 5. Generate unique human-readable order number
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SPORE-${datePrefix}-${randomSuffix}`;

      // 6. Create Order
      const isOnlinePaid = input.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          subtotal: new Prisma.Decimal(subtotal),
          deliveryFee: new Prisma.Decimal(deliveryFee),
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentStatus: isOnlinePaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          orderStatus: OrderStatus.CONFIRMED,
          deliveryAddressJson: deliveryAddressData as unknown as Prisma.InputJsonValue,
          deliverySlot: input.deliverySlot,
          notes: input.notes ?? null,
          items: {
            create: orderItemsToCreate,
          },
          statusHistory: {
            create: {
              status: OrderStatus.CONFIRMED,
              notes: "Order placed successfully via online storefront.",
            },
          },
        },
      });

      // 7. Create Payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: new Prisma.Decimal(totalAmount),
          method: input.paymentMethod,
          status: isOnlinePaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          paidAt: isOnlinePaid ? new Date() : null,
          transactionId: isOnlinePaid
            ? `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
            : null,
        },
      });

      // 8. Reserve Inventory Stock
      for (const res of stockReservations) {
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: {
            reservedStock: { increment: res.quantity },
          },
        });
      }

      // 9. Update customer total orders
      await tx.customer.update({
        where: { id: customer.id },
        data: { totalOrders: { increment: 1 } },
      });

      // 10. Audit Log
      await AuditService.logEvent(
        {
          actorId: actorId ?? userId,
          action: "ORDER_CREATED",
          entityType: "ORDER",
          entityId: order.id,
          newState: {
            orderNumber,
            totalAmount,
            itemsCount: orderItemsToCreate.length,
            paymentMethod: input.paymentMethod,
          },
        },
        tx,
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount,
        deliverySlot: order.deliverySlot,
      };
    });
  }

  /**
   * Fetch single order with details
   */
  static async getOrder(orderIdOrNumber: string, customerUserId?: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);

    const order = await db.order.findUnique({
      where: isUuid ? { id: orderIdOrNumber } : { orderNumber: orderIdOrNumber },
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        payments: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!order) {
      throw new ServiceError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    if (customerUserId && order.customer.userId !== customerUserId) {
      throw new ServiceError("FORBIDDEN", "You do not have access to this order", 403);
    }

    return order;
  }

  /**
   * List customer orders
   */
  static async listCustomerOrders(userId: string) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) return [];

    return await db.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, unitType: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * List admin orders with status & search filters
   */
  static async listAdminOrders(params: {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 25));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (params.status) {
      where.orderStatus = params.status;
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customer: { user: { name: { contains: q } } } },
        { customer: { user: { email: { contains: q } } } },
        { customer: { user: { phone: { contains: q } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
          items: {
            include: {
              product: { select: { name: true, unitType: true } },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Transitions order status along the order state machine.
   * Handles stock deduction upon delivery or stock release upon cancellation/refund.
   */
  static async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    notes?: string,
    actorId?: string,
  ) {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: { include: { inventoryItem: true } },
            },
          },
        },
      });

      if (!order) {
        throw new ServiceError("ORDER_NOT_FOUND", "Order not found", 404);
      }

      const prevStatus = order.orderStatus;
      if (prevStatus === nextStatus) return order;

      // Handle stock adjustments based on lifecycle
      if (
        (nextStatus === OrderStatus.CANCELLED || nextStatus === OrderStatus.REFUNDED) &&
        prevStatus !== OrderStatus.CANCELLED &&
        prevStatus !== OrderStatus.REFUNDED
      ) {
        // Release reserved stock back
        for (const item of order.items) {
          if (item.product?.inventoryItem) {
            const qty = Number(item.quantity);
            await tx.inventoryItem.update({
              where: { id: item.product.inventoryItem.id },
              data: {
                reservedStock: { decrement: qty },
              },
            });
          }
        }
      } else if (
        nextStatus === OrderStatus.DELIVERED &&
        prevStatus !== OrderStatus.DELIVERED
      ) {
        // Fulfill stock: decrement both availableStock and reservedStock, log transaction
        for (const item of order.items) {
          if (item.product?.inventoryItem) {
            const qty = Number(item.quantity);
            const updatedInv = await tx.inventoryItem.update({
              where: { id: item.product.inventoryItem.id },
              data: {
                availableStock: { decrement: qty },
                reservedStock: { decrement: qty },
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                inventoryItemId: item.product.inventoryItem.id,
                transactionType: InventoryTxType.CUSTOMER_SALE,
                quantity: new Prisma.Decimal(qty),
                balanceAfter: updatedInv.availableStock,
                referenceType: "ORDER",
                referenceId: order.id,
                reason: `Delivered order ${order.orderNumber}`,
                performedBy: actorId ?? null,
              },
            });
          }
        }

        // If Cash on delivery, mark payment as PAID
        await tx.payment.updateMany({
          where: { orderId: order.id, status: PaymentStatus.UNPAID },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.PAID },
        });
      }

      // Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: nextStatus,
          statusHistory: {
            create: {
              status: nextStatus,
              notes: notes ?? `Status transitioned from ${prevStatus} to ${nextStatus}`,
            },
          },
        },
      });

      // Audit Log
      await AuditService.logEvent(
        {
          actorId: actorId ?? null,
          action: "ORDER_STATUS_UPDATED",
          entityType: "ORDER",
          entityId: order.id,
          oldState: { status: prevStatus },
          newState: { status: nextStatus, notes },
        },
        tx,
      );

      return updatedOrder;
    });
  }

  /**
   * Get saved addresses for a customer
   */
  static async getCustomerAddresses(userId: string) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) return [];

    return await db.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
  }

  /**
   * Add a new customer address
   */
  static async addCustomerAddress(userId: string, input: DeliveryAddressInput) {
    let customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      customer = await db.customer.create({ data: { userId } });
    }

    if (input.isDefault) {
      await db.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    return await db.customerAddress.create({
      data: {
        customerId: customer.id,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        addressType: input.addressType,
        isDefault: input.isDefault,
      },
    });
  }
}
