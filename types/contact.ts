import type { ContactField } from "@/lib/validations/contact";

/** State returned by the sendContactRequest Server Action to the form (via useActionState). */
export type ContactFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<ContactField, string>>;
      values: Partial<Record<ContactField | "agentId", string>>;
    }
  | { status: "success"; email: string };
