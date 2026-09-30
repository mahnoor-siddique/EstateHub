import { EMAIL_MAX } from "@/lib/validations/auth";
import type { TableRow } from "@/types/database";

/*
 * Validation for the admin agent form. The Server Action always runs it. Limits mirror the agents
 * table checks (full_name 1–120, title/agency <= 120, email <= 254, phone <= 30, bio <= 2000).
 * The profile photo is validated separately (lib/validations/image-upload.ts).
 */

export const AGENT_NAME_MIN = 2;
export const AGENT_NAME_MAX = 120;
export const AGENT_TITLE_MAX = 120;
export const AGENCY_MAX = 120;
export const BIO_MAX = 2000;

export type AgentField = "full_name" | "title" | "email" | "phone" | "bio" | "agency_name";

/** The text columns the admin form writes (profile_image is handled with the photo upload). */
export type AgentWrite = Pick<TableRow<"agents">, AgentField>;

type Result = { ok: true; data: AgentWrite } | { ok: false; fieldErrors: Partial<Record<AgentField, string>> };

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateAgent(formData: FormData): Result {
  const fullName = text(formData, "full_name").replace(/\s+/g, " ");
  const title = text(formData, "title").replace(/\s+/g, " ");
  const email = text(formData, "email");
  const phone = text(formData, "phone").replace(/\s+/g, " ");
  const bio = text(formData, "bio");
  const agencyName = text(formData, "agency_name").replace(/\s+/g, " ");

  const fieldErrors: Partial<Record<AgentField, string>> = {};

  if (!fullName) fieldErrors.full_name = "Enter the agent's full name.";
  else if (fullName.length < AGENT_NAME_MIN) fieldErrors.full_name = `Use at least ${AGENT_NAME_MIN} characters.`;
  else if (fullName.length > AGENT_NAME_MAX) fieldErrors.full_name = `Keep the name under ${AGENT_NAME_MAX} characters.`;

  if (title.length > AGENT_TITLE_MAX) fieldErrors.title = `Keep the title under ${AGENT_TITLE_MAX} characters.`;

  if (email && (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)))
    fieldErrors.email = "Enter a valid email address, or leave it empty.";

  const digits = phone.replace(/\D/g, "").length;
  if (phone && (!PHONE_PATTERN.test(phone) || digits < 10 || digits > 15 || phone.length > 30))
    fieldErrors.phone = "Enter a valid phone number, e.g. +92 300 1234567, or leave it empty.";

  if (bio.length > BIO_MAX) fieldErrors.bio = `Keep the bio under ${BIO_MAX} characters.`;
  if (agencyName.length > AGENCY_MAX) fieldErrors.agency_name = `Keep the agency name under ${AGENCY_MAX} characters.`;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: {
      full_name: fullName,
      title: title || null,
      email: email || null,
      phone: phone || null,
      bio: bio || null,
      agency_name: agencyName || null,
    },
  };
}
