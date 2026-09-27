"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthField, FormAlert, PasswordField } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { buttonClasses } from "@/components/ui/Button";
import { MailIcon } from "@/components/ui/icons";
import { signUp } from "@/lib/auth/actions";
import type { SignupFormState } from "@/lib/auth/types";
import {
  EMAIL_MAX,
  FULL_NAME_MAX,
  FULL_NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "@/lib/validations/auth";

const initialState: SignupFormState = { status: "idle" };

/**
 * Account creation: full name, email, password and confirmation. Validation runs again on the
 * server; if Supabase requires email confirmation, the form is replaced by a "check your inbox"
 * message, otherwise the action signs the user in and redirects.
 */
export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const formRef = useFocusFirstError(state);

  if (state.status === "success") return <CheckEmail email={state.email} />;

  const errors = state.status === "error" ? state : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <FormAlert message={errors?.message} />
      <input type="hidden" name="next" value={next} />

      <AuthField
        label="Full name"
        name="fullName"
        type="text"
        autoComplete="name"
        required
        minLength={FULL_NAME_MIN}
        maxLength={FULL_NAME_MAX}
        defaultValue={errors?.values.fullName}
        error={errors?.fieldErrors?.fullName}
      />
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={EMAIL_MAX}
        defaultValue={errors?.values.email}
        error={errors?.fieldErrors?.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`}
        error={errors?.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX}
        error={errors?.fieldErrors?.confirmPassword}
      />

      <SubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}

function CheckEmail({ email }: { email: string }) {
  return (
    <div role="status" className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-sand text-gold-strong">
        <MailIcon className="size-7" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold">Check your inbox</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        We&apos;ve sent a confirmation link to{" "}
        <span className="font-medium break-all text-charcoal">{email}</span>. Open it to activate
        your account. Already registered with this email? You can log in instead.
      </p>
      <Link href="/login" className={buttonClasses({ variant: "secondary" }, "mt-6 w-full")}>
        Go to login
      </Link>
    </div>
  );
}
