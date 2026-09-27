"use client";

import { useActionState } from "react";
import { AuthField, FormAlert, PasswordField } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { logIn } from "@/lib/auth/actions";
import type { AuthNotice, LoginFormState } from "@/lib/auth/types";

const initialState: LoginFormState = { status: "idle" };

/**
 * Email + password login. The form posts straight to the logIn Server Action, so it also works
 * before JavaScript has loaded; on success the action redirects to `next`.
 */
export function LoginForm({ next, notice }: { next: string; notice?: AuthNotice }) {
  const [state, formAction, pending] = useActionState(logIn, initialState);
  const formRef = useFocusFirstError(state);
  const errors = state.status === "error" ? state : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {/* A page notice (e.g. from the confirmation link) shows until the first submit. */}
      {errors ? (
        <FormAlert message={errors.message} />
      ) : (
        state.status === "idle" && <FormAlert message={notice?.message} tone={notice?.tone} />
      )}
      <input type="hidden" name="next" value={next} />

      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        defaultValue={errors?.values.email}
        error={errors?.fieldErrors?.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        error={errors?.fieldErrors?.password}
      />

      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Log in
      </SubmitButton>
    </form>
  );
}
