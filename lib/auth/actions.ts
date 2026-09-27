"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAuthError, loginErrorMessage, signupErrorMessage } from "@/lib/auth/errors";
import type { LoginFormState, SignupFormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import { validateLogin, validateSignup } from "@/lib/validations/auth";

/*
 * Server Actions behind the /login and /signup forms. They run only on the server, re-validate
 * every field, and use the per-request Supabase client, which stores the session in HTTP-only
 * cookies. Passwords are never returned to the browser or logged.
 */

export async function logIn(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const result = validateLogin(formData);
  if (!result.ok) return { status: "error", fieldErrors: result.fieldErrors, values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    if (error.status === undefined || error.status >= 500) logAuthError("login", error);
    return { status: "error", message: loginErrorMessage(error), values: { email } };
  }

  // Re-render server components so anything that reads the session sees the signed-in user.
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signUp(_prev: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const result = validateSignup(formData);
  if (!result.ok) return { status: "error", fieldErrors: result.fieldErrors, values };

  const { fullName, email, password } = result.data;
  const next = safeRedirectPath(formData.get("next"));

  // The confirmation email links back to /auth/confirm on the site the user signed up from.
  // Next.js has already checked that the Origin header matches this host for Server Actions.
  const origin = (await headers()).get("origin");
  const emailRedirectTo = origin
    ? `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
    : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Stored as user metadata; the on_auth_user_created trigger copies it into profiles.
    options: { data: { full_name: fullName }, emailRedirectTo },
  });

  if (error) {
    if (error.status === undefined || error.status >= 500) logAuthError("signup", error);
    return { status: "error", message: signupErrorMessage(error), values };
  }

  // Email confirmation disabled in Supabase: the user is signed in straight away.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  // Email confirmation enabled (the Supabase default). For privacy Supabase gives the same
  // response whether or not the address is already registered, so the message stays neutral.
  return { status: "success", email };
}
