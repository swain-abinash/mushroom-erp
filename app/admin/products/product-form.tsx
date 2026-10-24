"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import type { ProductStatus, UnitType } from "@prisma/client";
import {
  Checkbox,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
} from "@/components/forms/form-controls";
import { generateSku, UNIT_LABELS, UNIT_TYPES } from "@/lib/catalog/format";
import type { FormState } from "@/lib/form-state";
import type { ProductForEdit } from "@/services/catalog.service";
import { saveProductAction } from "./actions";

type CategoryOption = { id: string; name: string; label: string };

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: "DRAFT", label: "Draft — hidden from the storefront" },
  { value: "PUBLISHED", label: "Published" },
  { value: "OUT_OF_STOCK", label: "Out of stock — visible, can't be ordered" },
  { value: "ARCHIVED", label: "Archived — hidden" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ProductForm({
  product,
  categories,
  varieties,
  canOverridePricing,
}: {
  product?: ProductForEdit;
  categories: CategoryOption[];
  varieties: string[];
  canOverridePricing: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveProductAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  // Previews belong to one submission: React clears the file input after the action runs.
  const [preview, setPreview] = useState<{ urls: string[]; forState: FormState }>({
    urls: [],
    forState: state,
  });
  const newImageUrls = preview.forState === state ? preview.urls : [];

  const errors = state.fieldErrors;
  const pricingLocked = Boolean(product) && !canOverridePricing;

  const value = (name: keyof ProductForEdit & string, fallback = ""): string => {
    if (state.values) return state.values[name] ?? "";
    const current = product?.[name];
    return current === undefined || current === null ? fallback : String(current);
  };
  const checked = (name: "isFeatured" | "allowBackorder") =>
    state.values ? state.values[name] === "on" : Boolean(product?.[name]);
  const primaryDefault =
    state.values?.primaryImage ?? product?.images.find((image) => image.isPrimary)?.id ?? "";

  function fillSku() {
    const form = formRef.current;
    if (!form || !skuRef.current) return;
    const data = new FormData(form);
    const category = categories.find((option) => option.id === data.get("categoryId"));
    const name = String(data.get("name") ?? "");
    if (!category || !name) return;
    skuRef.current.value = generateSku(category.name, name, data.get("unitType") as UnitType);
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <FormMessage state={state} />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Product name"
            name="name"
            defaultValue={value("name")}
            placeholder="Fresh Blue Oyster Mushrooms"
            required
            errors={errors?.name}
          />
          <Select
            label="Category"
            name="categoryId"
            defaultValue={value("categoryId")}
            placeholder="Choose a category"
            options={categories.map((category) => ({ value: category.id, label: category.label }))}
            required
            errors={errors?.categoryId}
          />
          <Field
            label="Mushroom variety"
            name="variety"
            list="variety-suggestions"
            defaultValue={value("variety")}
            placeholder="Blue Oyster"
            errors={errors?.variety}
          />
          <datalist id="variety-suggestions">
            {varieties.map((variety) => (
              <option key={variety} value={variety} />
            ))}
          </datalist>
          <div className="flex items-end gap-2">
            <Field
              ref={skuRef}
              label="SKU"
              name="sku"
              defaultValue={value("sku")}
              placeholder="Generated if left blank"
              className="w-full uppercase"
              errors={errors?.sku}
            />
            <button
              type="button"
              onClick={fillSku}
              className="mb-px rounded-lg border border-stone-200 dark:border-spore-ivory/20 px-3 py-2 font-body text-sm hover:bg-stone-50 dark:hover:bg-charcoal-dark"
            >
              Generate
            </button>
          </div>
        </div>
        <Field
          label="Short description (shown on product cards)"
          name="shortDescription"
          defaultValue={value("shortDescription")}
          maxLength={255}
          errors={errors?.shortDescription}
        />
        <TextArea
          label="Full description"
          name="description"
          defaultValue={value("description")}
          rows={6}
          required
          errors={errors?.description}
        />
      </Section>

      <Section title="Units & pricing">
        {pricingLocked ? (
          <p className="rounded-lg bg-warning-amber/10 px-3 py-2 font-body text-sm text-amber-700 dark:text-warning-amber">
            Prices of existing products can only be changed by a founder admin.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Selling unit"
            name="unitType"
            defaultValue={value("unitType", "KG")}
            options={UNIT_TYPES.map((unit) => ({ value: unit, label: UNIT_LABELS[unit].long }))}
            errors={errors?.unitType}
          />
          <Field
            label="Retail price (₹ per unit)"
            name="retailPrice"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={value("retailPrice")}
            readOnly={pricingLocked}
            required
            errors={errors?.retailPrice}
          />
          <Field
            label="Minimum order quantity"
            name="minOrderQty"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={value("minOrderQty", "1")}
            required
            errors={errors?.minOrderQty}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-3 rounded-xl border border-stone-200 dark:border-spore-ivory/10 p-4">
            <legend className="px-1 font-body text-sm font-medium">Restaurant (B2B) tier</legend>
            <Field
              label="Price (₹ per unit)"
              name="restaurantPrice"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={value("restaurantPrice")}
              readOnly={pricingLocked}
              errors={errors?.restaurantPrice}
            />
            <Field
              label="Applies from quantity"
              name="restaurantMinQty"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={value("restaurantMinQty")}
              placeholder="1"
              readOnly={pricingLocked}
              errors={errors?.restaurantMinQty}
            />
          </fieldset>
          <fieldset className="flex flex-col gap-3 rounded-xl border border-stone-200 dark:border-spore-ivory/10 p-4">
            <legend className="px-1 font-body text-sm font-medium">Wholesale tier</legend>
            <Field
              label="Price (₹ per unit)"
              name="wholesalePrice"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={value("wholesalePrice")}
              readOnly={pricingLocked}
              errors={errors?.wholesalePrice}
            />
            <Field
              label="Applies from quantity"
              name="wholesaleMinQty"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={value("wholesaleMinQty")}
              placeholder="1"
              readOnly={pricingLocked}
              errors={errors?.wholesaleMinQty}
            />
          </fieldset>
        </div>
        <p className="font-body text-xs text-stone-600 dark:text-spore-ivory/60">
          Leave a tier blank to sell that customer type at the retail price.
        </p>
      </Section>

      <Section title="Stock & freshness">
        <div className="grid gap-4 sm:grid-cols-3">
          {product ? (
            <div className="flex flex-col gap-1.5 font-body text-sm">
              <span className="font-medium">Current stock</span>
              <span className="py-2 font-data">
                {product.stock ?? 0} {UNIT_LABELS[product.unitType].short}
              </span>
              <span className="text-xs text-stone-600 dark:text-spore-ivory/60">
                Adjusted from Inventory (Sprint 5).
              </span>
            </div>
          ) : (
            <Field
              label="Opening stock"
              name="openingStock"
              type="number"
              step="0.01"
              min="0"
              defaultValue={state.values?.openingStock ?? ""}
              placeholder="0"
              errors={errors?.openingStock}
            />
          )}
          <Field
            label="Low-stock alert at"
            name="reorderThreshold"
            type="number"
            step="0.01"
            min="0"
            defaultValue={value("reorderThreshold", "5")}
            errors={errors?.reorderThreshold}
          />
          <Field
            label="Shelf life (days)"
            name="shelfLifeDays"
            type="number"
            min="1"
            step="1"
            defaultValue={value("shelfLifeDays", "2")}
            required
            errors={errors?.shelfLifeDays}
          />
        </div>
      </Section>

      <Section title="Product page details">
        <TextArea
          label="Nutritional profile"
          name="nutritionInfo"
          defaultValue={value("nutritionInfo")}
          placeholder="High protein, rich in Vitamin D and B-complex…"
          errors={errors?.nutritionInfo}
        />
        <TextArea
          label="Cooking & storage guide"
          name="storageTips"
          defaultValue={value("storageTips")}
          placeholder="Store in a paper bag at 4°C. Use within 2 days…"
          errors={errors?.storageTips}
        />
      </Section>

      <Section title="Images">
        {product?.images.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.images.map((image) => (
              <div key={image.id} className="flex flex-col gap-2 font-body text-xs">
                <Image
                  src={image.imageUrl}
                  alt={image.altText ?? product.name}
                  width={240}
                  height={240}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="primaryImage"
                    value={image.id}
                    defaultChecked={primaryDefault === image.id}
                  />
                  Main image
                </label>
                <label className="flex items-center gap-2 text-red-600 dark:text-alert-coral">
                  <input type="checkbox" name="removeImageIds" value={image.id} />
                  Remove
                </label>
              </div>
            ))}
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5 font-body text-sm">
          <span className="font-medium">Add images</span>
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(event) =>
              setPreview({
                urls: [...(event.target.files ?? [])].map((file) => URL.createObjectURL(file)),
                forState: state,
              })
            }
            className="font-body text-sm file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 dark:file:bg-spore-ivory file:px-4 file:py-2 file:font-semibold file:text-forest-primary dark:file:text-spore-ivory"
          />
          <span className="text-xs text-stone-600 dark:text-spore-ivory/60">
            JPEG, PNG, WebP or AVIF · up to 4 MB each · 5 per save. The first image becomes the main
            image unless you pick one.
          </span>
          {errors?.images ? (
            <span className="text-xs text-red-600 dark:text-alert-coral">{errors.images[0]}</span>
          ) : null}
        </label>

        {newImageUrls.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {newImageUrls.map((url, index) => (
              <div key={url} className="flex flex-col gap-2 font-body text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <label className="flex items-center gap-2">
                  <input type="radio" name="primaryImage" value={`new:${index}`} />
                  Main image
                </label>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Visibility">
        <Select
          label="Status"
          name="status"
          defaultValue={value("status", "DRAFT")}
          options={STATUS_OPTIONS}
          errors={errors?.status}
        />
        <Checkbox
          label="Featured on the homepage"
          name="isFeatured"
          defaultChecked={checked("isFeatured")}
        />
        <Checkbox
          label="Allow back-orders"
          name="allowBackorder"
          hint="Customers can still order when stock runs out (fulfilled from the next harvest)."
          defaultChecked={checked("allowBackorder")}
        />
      </Section>

      <SubmitButton className="self-start">
        {product ? "Save changes" : "Create product"}
      </SubmitButton>
    </form>
  );
}
