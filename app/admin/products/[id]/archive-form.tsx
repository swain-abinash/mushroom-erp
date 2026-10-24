"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-controls";
import { archiveProductAction } from "../actions";

export function ArchiveProductForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(archiveProductAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Archive this product? It will be hidden from the storefront.")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-start gap-2"
    >
      <FormMessage state={state} />
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-alert-coral px-5 py-2 font-display text-sm font-semibold text-red-600 dark:text-alert-coral disabled:opacity-60"
      >
        Archive product
      </button>
    </form>
  );
}
