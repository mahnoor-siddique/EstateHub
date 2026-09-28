"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { validateContact } from "@/lib/validations/contact";
import type { ContactFormState } from "@/types/contact";

/*
 * Server Action behind the /contact form. Guests and signed-in users can both use it.
 *
 * Identity is never taken from the form: the insert runs with the caller's own Supabase session
 * (none for guests), and the contact_requests_set_defaults trigger sets user_id from that session.
 * The browser has no way to send a user_id — the column is not even insertable.
 */
export async function sendContactRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = Object.fromEntries(
    (["name", "email", "phone", "message", "agentId"] as const).map((field) => [
      field,
      String(formData.get(field) ?? ""),
    ]),
  );

  // Honeypot: a field real visitors never see or fill. Bots that fill it get a normal-looking
  // success response, and nothing is saved.
  if (String(formData.get("website") ?? "").trim()) {
    return { status: "success", email: values.email };
  }

  const result = validateContact(formData);
  if (!result.ok) {
    return { status: "error", message: result.formError, fieldErrors: result.fieldErrors, values };
  }

  const { propertyId, agentId, name, email, phone, message } = result.data;
  const supabase = await createClient();
  // No .select() afterwards: guests cannot read contact requests, so the insert must not ask for
  // the new row back.
  const { error } = await supabase.from("contact_requests").insert({
    property_id: propertyId,
    agent_id: agentId,
    name,
    email,
    phone,
    message,
  });

  if (error) return { status: "error", message: contactErrorMessage(error), values };
  return { status: "success", email };
}

/** Friendly message for a failed insert. Only the error code is logged — never the form data. */
function contactErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case "23503": // property or agent no longer exists
      return "We couldn't find that property or agent. It may have been removed.";
    case "P0001": // raised by contact_requests_set_defaults: agent does not handle the property
      return "This form is out of date. Please reload the page and try again.";
    default:
      console.error("[contact] insert failed", { code: error.code });
      return "We couldn't send your message. Please try again.";
  }
}
