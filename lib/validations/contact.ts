import { isUuid } from "@/lib/queries/supabase/shared";
import { EMAIL_MAX, FULL_NAME_MAX, FULL_NAME_MIN } from "@/lib/validations/auth";

/*
 * Validation for the contact-agent form. The Server Action always runs it; the browser's
 * required/maxLength attributes are only a convenience. Limits mirror contact_requests
 * (name 1–120, email <= 254, phone <= 30, message 1–2000).
 *
 * user_id is deliberately not part of this: the database sets it from the caller's session.
 */

export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;

export type ContactField = "name" | "email" | "phone" | "message";

export type ContactInput = {
  propertyId: string | null;
  agentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

type Result =
  | { ok: true; data: ContactInput }
  | { ok: false; fieldErrors: Partial<Record<ContactField, string>>; formError?: string };

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Digits with optional leading +, spaces, dashes or brackets, e.g. "+92 300 1234567".
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/** An optional id from a hidden field: "" means none; anything else must be a uuid. */
function optionalId(value: string): string | null | undefined {
  if (!value) return null;
  return isUuid(value) ? value : undefined; // undefined = tampered
}

export function validateContact(formData: FormData): Result {
  const propertyId = optionalId(text(formData.get("propertyId")).trim());
  const agentId = optionalId(text(formData.get("agentId")).trim());
  const name = text(formData.get("name")).trim().replace(/\s+/g, " ");
  const email = text(formData.get("email")).trim();
  const phone = text(formData.get("phone")).trim().replace(/\s+/g, " ");
  const message = text(formData.get("message")).trim();

  if (propertyId === undefined || agentId === undefined) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "This form is out of date. Please reload the page and try again.",
    };
  }

  const fieldErrors: Partial<Record<ContactField, string>> = {};

  if (!name) fieldErrors.name = "Enter your full name.";
  else if (name.length < FULL_NAME_MIN)
    fieldErrors.name = `Your name must be at least ${FULL_NAME_MIN} characters.`;
  else if (name.length > FULL_NAME_MAX)
    fieldErrors.name = `Your name must be ${FULL_NAME_MAX} characters or fewer.`;

  if (!email) fieldErrors.email = "Enter your email address.";
  else if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email))
    fieldErrors.email = "Enter a valid email address.";

  // Phone is optional for enquiries (unlike bookings), but must be valid if given.
  const digits = phone.replace(/\D/g, "").length;
  if (phone && (!PHONE_PATTERN.test(phone) || digits < 10 || digits > 15 || phone.length > 30))
    fieldErrors.phone = "Enter a valid phone number, e.g. 0300 1234567 or +92 300 1234567.";

  if (!message) fieldErrors.message = "Enter a message for the agent.";
  else if (message.length < CONTACT_MESSAGE_MIN)
    fieldErrors.message = `Please write at least ${CONTACT_MESSAGE_MIN} characters.`;
  else if (message.length > CONTACT_MESSAGE_MAX)
    fieldErrors.message = `Keep your message under ${CONTACT_MESSAGE_MAX} characters.`;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: { propertyId, agentId, name, email, phone: phone || null, message },
  };
}
