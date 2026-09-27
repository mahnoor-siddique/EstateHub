import type { LoginField, SignupField } from "@/lib/validations/auth";

/*
 * State returned by the auth Server Actions to the forms (via useActionState). `values` refills
 * the non-secret fields after a failed attempt; password fields are never echoed back.
 */

/** The minimum the UI needs about the signed-in user. Never includes tokens. */
export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
};

/** A one-off message shown above the login form, e.g. after following a confirmation link. */
export type AuthNotice = { tone: "error" | "success"; message: string };

export type SignOutState = { status: "idle" } | { status: "error"; message: string };

export type LoginFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<LoginField, string>>;
      values: { email: string };
    };

export type SignupFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<SignupField, string>>;
      values: { fullName: string; email: string };
    }
  | { status: "success"; email: string };
