/*
 * Validation for the login and signup forms. The server actions always run these checks — the
 * browser's required/minLength/type="email" attributes are only a convenience and can be bypassed.
 * Limits match the profiles table (full_name <= 120, email <= 254). Passwords are capped at 72
 * characters because Supabase Auth hashes with bcrypt, which ignores anything longer.
 */

export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

// Same shape as the email check constraints in the database.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type LoginField = "email" | "password";
export type SignupField = "fullName" | "email" | "password" | "confirmPassword";

type FieldErrors<F extends string> = Partial<Record<F, string>>;

type ValidationResult<F extends string, T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors<F> };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function emailError(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
}

export function validateLogin(
  formData: FormData,
): ValidationResult<LoginField, { email: string; password: string }> {
  const email = text(formData.get("email")).trim();
  const password = text(formData.get("password"));

  const fieldErrors: FieldErrors<LoginField> = {};
  const emailProblem = emailError(email);
  if (emailProblem) fieldErrors.email = emailProblem;
  // No strength rules at login — just make sure something was typed.
  if (!password) fieldErrors.password = "Enter your password.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, data: { email, password } };
}

export function validateSignup(
  formData: FormData,
): ValidationResult<SignupField, { fullName: string; email: string; password: string }> {
  // Collapse runs of whitespace so "  Ali   Khan " is stored as "Ali Khan".
  const fullName = text(formData.get("fullName")).trim().replace(/\s+/g, " ");
  const email = text(formData.get("email")).trim();
  const password = text(formData.get("password"));
  const confirmPassword = text(formData.get("confirmPassword"));

  const fieldErrors: FieldErrors<SignupField> = {};

  if (!fullName) fieldErrors.fullName = "Enter your full name.";
  else if (fullName.length < FULL_NAME_MIN)
    fieldErrors.fullName = `Your name must be at least ${FULL_NAME_MIN} characters.`;
  else if (fullName.length > FULL_NAME_MAX)
    fieldErrors.fullName = `Your name must be ${FULL_NAME_MAX} characters or fewer.`;

  const emailProblem = emailError(email);
  if (emailProblem) fieldErrors.email = emailProblem;

  if (!password) fieldErrors.password = "Create a password.";
  else if (password.length < PASSWORD_MIN)
    fieldErrors.password = `Use at least ${PASSWORD_MIN} characters.`;
  else if (password.length > PASSWORD_MAX)
    fieldErrors.password = `Use ${PASSWORD_MAX} characters or fewer.`;
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    fieldErrors.password = "Include at least one letter and one number.";

  if (!confirmPassword) fieldErrors.confirmPassword = "Confirm your password.";
  else if (confirmPassword !== password) fieldErrors.confirmPassword = "Passwords do not match.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, data: { fullName, email, password } };
}
