"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";
import { cn } from "@/lib/utils";
import { notifyMeAction } from "../actions";

export function ProductGallery({
  images,
  name,
}: {
  images: Array<{ url: string; alt: string }>;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-forest-primary/5">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-8xl" aria-hidden>
            🍄
          </span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto" role="tablist" aria-label={`${name} photos`}>
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show photo ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg border-2",
                index === active
                  ? "border-forest-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function QuantitySelector({
  min,
  step,
  max,
  unitLabel,
  canOrder,
}: {
  min: number;
  step: number;
  max: number | null;
  unitLabel: string;
  canOrder: boolean;
}) {
  const [quantity, setQuantity] = useState(min);
  const clamp = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return Math.max(min, max === null ? rounded : Math.min(max, rounded));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-forest-primary/30">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={!canOrder || quantity <= min}
            onClick={() => setQuantity((value) => clamp(value - step))}
            className="size-11 rounded-full text-xl disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-20 text-center font-data" aria-live="polite">
            {quantity} {unitLabel}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={!canOrder || (max !== null && quantity + step > max)}
            onClick={() => setQuantity((value) => clamp(value + step))}
            className="size-11 rounded-full text-xl disabled:opacity-40"
          >
            +
          </button>
        </div>
        {max !== null && canOrder ? (
          <span className="font-body text-xs text-forest-primary/60">
            {max} {unitLabel} available
          </span>
        ) : null}
      </div>
      <button
        type="button"
        disabled
        className="rounded-full bg-forest-primary px-6 py-3 font-display font-semibold text-spore-ivory disabled:opacity-60"
      >
        🛒 Add to cart
      </button>
      <p className="font-body text-xs text-forest-primary/60">Online ordering is coming soon.</p>
    </div>
  );
}

export function InfoTabs({
  tabs,
}: {
  tabs: Array<{ id: string; label: string; content: string }>;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-2 border-b border-forest-primary/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 font-display text-sm font-semibold",
              active === tab.id
                ? "border-forest-primary text-forest-primary"
                : "border-transparent text-forest-primary/60",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="whitespace-pre-line font-body text-forest-primary/80"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export function NotifyMeForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(notifyMeAction, {});

  if (state.success) return <FormMessage state={state} />;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-forest-primary/10 bg-surface-white p-4"
    >
      <p className="font-display font-semibold text-forest-primary">
        Notify me when it&apos;s back
      </p>
      <FormMessage state={state} />
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-end gap-3 text-forest-primary">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-w-56"
          errors={state.fieldErrors?.email}
        />
        <SubmitButton className="px-5 py-2 text-sm">Notify me</SubmitButton>
      </div>
    </form>
  );
}
