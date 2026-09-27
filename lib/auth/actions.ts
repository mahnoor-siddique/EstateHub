"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAuthError, loginErrorMessage, signupErrorMessage } from "@/lib/auth/errors";
import type { LoginFormState, SignOutState, SignupFormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth/routes";
import { validateLogin, validateSignup } from "@/lib/validations/auth";

/*
 * Server Actions behind the /login and /signup forms and the navbar's Sign out button. They run
 * only on the server, re-validate every field, and use the per-request Supabase client, which
 * stores the session in HTTP-only cookies. Passwords are never returned to the browser or logged.
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
  redirect(postLoginPath(formData.get("next")));
}

export async function signUp(_prev: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const result = validateSignup(formData);
  if (!result.ok) return { status: "error", fieldErrors: result.fieldErrors, values };

  const { fullName, email, password } = result.data;
  const next = postLoginPath(formData.get("next"));

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

// Used with useActionState, which passes (prevState, formData); sign-out needs neither.
export async function signOut(): Promise<SignOutState> {
  const supabase = await createClient();
  // "local" ends only this browser's session (and revokes its refresh token); the user stays
  // signed in on their other devices.
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    logAuthError("sign out", error);
    // If Supabase could not be reached to revoke the token, the client has usually still cleared
    // the session cookies. Only report failure if this browser is actually still signed in.
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) {
      return { status: "error", message: "We couldn't sign you out. Please try again." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}
