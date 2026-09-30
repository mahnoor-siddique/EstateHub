import type { PostgrestError } from "@supabase/supabase-js";

/*
 * Helpers shared by the admin Server Actions. Only error codes are logged — never form contents.
 */

/** Friendly message for a failed admin write. `what` completes "We couldn't …". */
export function adminWriteErrorMessage(error: PostgrestError, what: string): string {
  switch (error.code) {
    case "42501": // RLS or privilege: not (or no longer) an admin
      return "You don't have permission to do that. Sign in again with an admin account.";
    case "23503": // foreign key: a linked record is missing or still in use
      return `We couldn't ${what} because it is linked to other records. Reload the page and try again.`;
    case "23505":
      return `We couldn't ${what} because it would duplicate an existing record. Reload the page and try again.`;
    case "23514": // check constraint
    case "22P02": // invalid input syntax
    case "22003": // numeric out of range
      return "Some values were not accepted. Check the form and try again.";
    default:
      console.error("[admin] write failed", { what, code: error.code });
      return `We couldn't ${what}. Please try again.`;
  }
}

/** The form's text values, to refill it after a failed submit (files are skipped). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}
