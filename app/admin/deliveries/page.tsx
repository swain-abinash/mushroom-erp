import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { hasPermission, requireDeliveryAccess } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getAgentDashboard,
  getAgentSummaries,
  listDeliveryAgents,
  listOrdersAwaitingAssignment,
} from "@/services/delivery.service";
import { AssignAgentForm, CollectForm, DeliveredForm } from "./delivery-forms";

export const instant = false;
export const metadata: Metadata = { title: "Deliveries — SporeERP Admin" };

type Address = {
  recipientName?: string;
  recipientPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  pincode?: string;
};

function AddressBlock({ json }: { json: unknown }) {
  const a = (json ?? {}) as Address;
  return (
    <div className="text-xs text-stone-600 dark:text-spore-ivory/70">
      <div className="font-semibold">
        {a.recipientName} · {a.recipientPhone}
      </div>
      <div>
        {[a.addressLine1, a.addressLine2, a.city, a.pincode].filter(Boolean).join(", ")}
      </div>
    </div>
  );
}

const card =
  "rounded-2xl border border-stone-200/80 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5";

export default async function DeliveriesPage() {
  const user = await requireDeliveryAccess();

  if (hasPermission(user, PERMISSIONS.DELIVERIES_VIEW_ALL)) {
    return <ManagerView canAssign={hasPermission(user, PERMISSIONS.DELIVERIES_ASSIGN)} />;
  }
  return <AgentView userId={user.id} name={user.name} />;
}

async function ManagerView({ canAssign }: { canAssign: boolean }) {
  const [summaries, awaiting, agents] = await Promise.all([
    getAgentSummaries(),
    listOrdersAwaitingAssignment(),
    listDeliveryAgents(),
  ]);
  const agentOptions = agents.map((a) => ({ id: a.id, name: a.user.name }));

  return (
    <div className="flex flex-col gap-8 font-body">
      <header>
        <h1 className="font-display text-2xl font-bold">Deliveries</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-spore-ivory/70">
          Assign packed orders to delivery agents and track what each agent holds and has delivered.
        </p>
      </header>

      <section className={card}>
        <h2 className="mb-4 font-display text-lg font-bold">Delivery agents</h2>
        {summaries.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-spore-ivory/60">
            No delivery agents yet. Invite one from{" "}
            <Link href="/admin/employees" className="underline">
              Employees &amp; Access
            </Link>{" "}
            with the Delivery Agent role.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500 dark:text-spore-ivory/60">
                <tr>
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Assigned</th>
                  <th className="py-2 pr-4">In transit</th>
                  <th className="py-2 pr-4">Delivered today</th>
                  <th className="py-2 pr-4">Delivered total</th>
                  <th className="py-2 pr-4">Value delivered</th>
                  <th className="py-2">Stock in hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10">
                {summaries.map((agent) => (
                  <tr key={agent.id} className={agent.isActive ? undefined : "opacity-60"}>
                    <td className="py-3 pr-4 align-top">
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-xs text-stone-500 dark:text-spore-ivory/60">
                        {agent.phone ?? "—"}
                        {agent.isActive ? "" : " · inactive"}
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top">{agent.assigned}</td>
                    <td className="py-3 pr-4 align-top">{agent.inTransit}</td>
                    <td className="py-3 pr-4 align-top font-semibold">{agent.deliveredToday}</td>
                    <td className="py-3 pr-4 align-top font-semibold">{agent.deliveredTotal}</td>
                    <td className="py-3 pr-4 align-top">{formatCurrency(agent.deliveredValue)}</td>
                    <td className="py-3 align-top">
                      {agent.holdings.length === 0 ? (
                        <span className="text-stone-500 dark:text-spore-ivory/40">Nothing</span>
                      ) : (
                        <ul className="text-xs">
                          {agent.holdings.map((h) => (
                            <li key={h.name}>
                              {h.name}: <b>{h.quantity}</b> {h.unit}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-1 font-display text-lg font-bold">Orders ready for a delivery agent</h2>
        <p className="mb-4 text-xs text-stone-500 dark:text-spore-ivory/60">
          Confirmed, processing and packed orders. The agent collects an order once it is packed.
        </p>
        {awaiting.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-spore-ivory/60">No orders waiting.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500 dark:text-spore-ivory/60">
                <tr>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Deliver to</th>
                  <th className="py-2 pr-4">Slot</th>
                  <th className="py-2">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10">
                {awaiting.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 pr-4 align-top">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold underline">
                        {order.orderNumber}
                      </Link>
                      <div className="text-xs text-stone-500 dark:text-spore-ivory/60">
                        {order.items.length} item(s) · {formatCurrency(Number(order.totalAmount))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">
                      {order.orderStatus.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <AddressBlock json={order.deliveryAddressJson} />
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">
                      {order.deliverySlot.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 align-top">
                      {canAssign ? (
                        <AssignAgentForm
                          orderId={order.id}
                          agents={agentOptions}
                          currentDriverId={order.delivery?.driverId ?? null}
                        />
                      ) : (
                        (order.delivery?.driver?.user.name ?? "Unassigned")
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

async function AgentView({ userId, name }: { userId: string; name: string }) {
  const data = await getAgentDashboard(userId);

  if (!data) {
    return (
      <div className={`${card} font-body`}>
        <h1 className="font-display text-xl font-bold">Deliveries</h1>
        <p className="mt-2 text-sm">No delivery profile is linked to this account yet.</p>
      </div>
    );
  }

  const { active, recent, holdings, deliveredToday, deliveredTotal } = data;

  return (
    <div className="flex flex-col gap-6 font-body">
      <header>
        <h1 className="font-display text-2xl font-bold">My deliveries</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-spore-ivory/70">
          Hi {name}. Collect packed orders, deliver them and mark each one delivered.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={card}>
          <div className="text-xs uppercase text-stone-500 dark:text-spore-ivory/60">To deliver</div>
          <div className="mt-1 text-2xl font-bold">{active.length}</div>
        </div>
        <div className={card}>
          <div className="text-xs uppercase text-stone-500 dark:text-spore-ivory/60">Delivered today</div>
          <div className="mt-1 text-2xl font-bold">{deliveredToday}</div>
        </div>
        <div className={card}>
          <div className="text-xs uppercase text-stone-500 dark:text-spore-ivory/60">Delivered total</div>
          <div className="mt-1 text-2xl font-bold">{deliveredTotal}</div>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-display text-lg font-bold">Stock in my hand</h2>
        {holdings.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-spore-ivory/60">
            You are not carrying any stock.
          </p>
        ) : (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {holdings.map((h) => (
              <li key={h.id} className="flex justify-between rounded-lg bg-stone-100 dark:bg-white/5 px-3 py-2">
                <span>{h.inventoryItem.itemName}</span>
                <b>
                  {Number(h.quantity)} {h.inventoryItem.unit}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Orders to deliver</h2>
        {active.length === 0 ? (
          <div className={card}>
            <p className="text-sm text-stone-500 dark:text-spore-ivory/60">
              Nothing assigned right now.
            </p>
          </div>
        ) : (
          active.map((order) => {
            const outForDelivery = order.orderStatus === OrderStatus.OUT_FOR_DELIVERY;
            const cod = order.payments.some((p) => p.status === "UNPAID");
            return (
              <article key={order.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-bold">{order.orderNumber}</div>
                    <div className="text-xs text-stone-500 dark:text-spore-ivory/60">
                      {order.deliverySlot.replace(/_/g, " ")} ·{" "}
                      {outForDelivery ? "Out for delivery" : "Packed — ready to collect"}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold">{formatCurrency(Number(order.totalAmount))}</div>
                    <div className="text-xs text-stone-500 dark:text-spore-ivory/60">
                      {cod ? "Collect cash on delivery" : "Paid"}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <AddressBlock json={order.deliveryAddressJson} />
                </div>
                <ul className="mt-3 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product?.name} × {Number(item.quantity)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {outForDelivery ? (
                    <DeliveredForm orderId={order.id} />
                  ) : (
                    <CollectForm orderId={order.id} />
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 font-display text-lg font-bold">Recently delivered</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-spore-ivory/60">No deliveries yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-spore-ivory/10 text-sm">
            {recent.map((order) => (
              <li key={order.id} className="flex justify-between py-2">
                <span>{order.orderNumber}</span>
                <span className="text-xs text-stone-500 dark:text-spore-ivory/60">
                  {order.delivery?.deliveredAt ? formatDate(order.delivery.deliveredAt) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
