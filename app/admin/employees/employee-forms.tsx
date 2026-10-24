"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";
import { assignRolesAction, inviteEmployeeAction, setEmployeeActiveAction } from "./actions";

type RoleOption = { name: string; displayName: string };

function RoleCheckboxes({ roles, selected = [] }: { roles: RoleOption[]; selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {roles.map((role) => (
        <label key={role.name} className="flex items-center gap-2 font-body text-sm">
          <input
            type="checkbox"
            name="roles"
            value={role.name}
            defaultChecked={selected.includes(role.name)}
          />
          {role.displayName}
        </label>
      ))}
    </div>
  );
}

export function InviteEmployeeForm({ roles }: { roles: RoleOption[] }) {
  const [state, formAction] = useActionState(inviteEmployeeAction, {});
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {state.data?.inviteUrl ? (
        <p className="break-all rounded-lg bg-white dark:bg-surface-charcoal px-3 py-2 font-data text-xs">
          {state.data.inviteUrl}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required errors={errors?.name} />
        <Field label="Email" name="email" type="email" required errors={errors?.email} />
        <Field label="Phone (optional)" name="phone" type="tel" errors={errors?.phone} />
        <Field
          label="Joining date"
          name="joiningDate"
          type="date"
          required
          errors={errors?.joiningDate}
        />
        <Field
          label="Designation"
          name="designation"
          placeholder="Cultivation Lead"
          required
          errors={errors?.designation}
        />
        <Field
          label="Department"
          name="department"
          placeholder="Production"
          required
          errors={errors?.department}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-body text-sm font-medium">Roles</legend>
        <RoleCheckboxes roles={roles} />
        {errors?.roles ? <span className="text-xs text-red-600 dark:text-alert-coral">{errors.roles[0]}</span> : null}
      </fieldset>
      <SubmitButton className="self-start">Send invite</SubmitButton>
    </form>
  );
}

export function AssignRolesForm({
  userId,
  roles,
  selected,
}: {
  userId: string;
  roles: RoleOption[];
  selected: string[];
}) {
  const [state, formAction] = useActionState(assignRolesAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <RoleCheckboxes roles={roles} selected={selected} />
      <div className="flex items-center gap-3">
        <SubmitButton className="px-4 py-1.5 text-sm">Save roles</SubmitButton>
        <InlineMessage
          error={state.error ?? state.fieldErrors?.roles?.[0]}
          success={state.success}
        />
      </div>
    </form>
  );
}

export function ToggleActiveForm({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [state, formAction] = useActionState(setEmployeeActiveAction, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <SubmitButton className="px-4 py-1.5 text-sm">
        {isActive ? "Deactivate" : "Reactivate"}
      </SubmitButton>
      <InlineMessage error={state.error} />
    </form>
  );
}

function InlineMessage({ error, success }: { error?: string; success?: string }) {
  if (error) return <span className="text-xs text-red-600 dark:text-alert-coral">{error}</span>;
  if (success) return <span className="text-xs text-green-700 dark:text-success-mint">{success}</span>;
  return null;
}
