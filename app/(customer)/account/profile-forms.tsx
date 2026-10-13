"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";

type Profile = {
  name: string;
  email: string;
  phone: string | null;
  customer: { companyName: string | null; gstin: string | null } | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfileAction, {});
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field
        label="Full name"
        name="name"
        defaultValue={profile.name}
        required
        errors={errors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={profile.email}
        disabled
        readOnly
      />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={profile.phone ?? ""}
        errors={errors?.phone}
      />
      {profile.customer ? (
        <>
          <Field
            label="Company / restaurant name (B2B)"
            name="companyName"
            defaultValue={profile.customer.companyName ?? ""}
            errors={errors?.companyName}
          />
          <Field
            label="GSTIN (B2B)"
            name="gstin"
            defaultValue={profile.customer.gstin ?? ""}
            errors={errors?.gstin}
          />
        </>
      ) : null}
      <SubmitButton className="self-start">Save profile</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, {});
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        errors={errors?.currentPassword}
      />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={errors?.password}
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={errors?.confirmPassword}
      />
      <SubmitButton className="self-start">Change password</SubmitButton>
    </form>
  );
}
