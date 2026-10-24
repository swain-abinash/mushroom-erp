"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/form-controls";
import { assignAgentAction, collectOrderAction, markDeliveredAction } from "./actions";

function InlineMessage({ error, success }: { error?: string; success?: string }) {
  if (error) return <span className="text-xs text-red-600 dark:text-alert-coral">{error}</span>;
  if (success) return <span className="text-xs text-green-700 dark:text-success-mint">{success}</span>;
  return null;
}

export function AssignAgentForm({
  orderId,
  agents,
  currentDriverId,
}: {
  orderId: string;
  agents: { id: string; name: string }[];
  currentDriverId: string | null;
}) {
  const [state, formAction] = useActionState(assignAgentAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="driverId"
        defaultValue={currentDriverId ?? ""}
        aria-label="Delivery agent"
        className="rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 px-2 py-1.5 text-sm"
      >
        <option value="" disabled>
          Choose agent…
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      <SubmitButton className="px-3 py-1.5 text-sm">
        {currentDriverId ? "Reassign" : "Assign"}
      </SubmitButton>
      <InlineMessage error={state.error ?? state.fieldErrors?.driverId?.[0]} success={state.success} />
    </form>
  );
}

export function CollectForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(collectOrderAction, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className="px-4 py-2 text-sm">Collect stock</SubmitButton>
      <InlineMessage error={state.error} success={state.success} />
    </form>
  );
}

export function DeliveredForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(markDeliveredAction, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input
        name="notes"
        maxLength={255}
        placeholder="Note (optional) e.g. handed to security"
        className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 px-2 py-1.5 text-sm"
      />
      <SubmitButton className="px-4 py-2 text-sm">Mark delivered</SubmitButton>
      <InlineMessage error={state.error} success={state.success} />
    </form>
  );
}
