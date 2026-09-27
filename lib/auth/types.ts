import type { LoginField, SignupField } from "@/lib/validations/auth";

/*
 * State returned by the auth Server Actions to the forms (via useActionState). `values` refills
 * the non-secret fields after a failed attempt; password fields are never echoed back.
 */

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
