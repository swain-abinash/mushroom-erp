"use client";

import { useActionState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
} from "@/components/forms/form-controls";
import type { FormState } from "@/lib/form-state";
import { saveCategoryAction } from "./actions";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
};

export function CategoryForm({
  category,
  parents,
}: {
  category?: Category;
  parents: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveCategoryAction, {});
  const errors = state.fieldErrors;
  const value = (name: "name" | "description" | "parentId") =>
    state.values ? (state.values[name] ?? "") : (category?.[name] ?? "");
  const isActive = state.values ? state.values.isActive === "on" : (category?.isActive ?? true);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FormMessage state={state} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          defaultValue={value("name")}
          required
          errors={errors?.name}
        />
        <Select
          label="Parent category"
          name="parentId"
          defaultValue={value("parentId")}
          placeholder="None (top level)"
          options={parents
            .filter((parent) => parent.id !== category?.id)
            .map((parent) => ({ value: parent.id, label: parent.name }))}
          errors={errors?.parentId}
        />
      </div>
      <TextArea
        label="Description"
        name="description"
        rows={2}
        defaultValue={value("description")}
        errors={errors?.description}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          label="Active (visible on the storefront)"
          name="isActive"
          defaultChecked={isActive}
        />
        <SubmitButton className="px-5 py-2 text-sm">
          {category ? "Save" : "Create category"}
        </SubmitButton>
      </div>
    </form>
  );
}
