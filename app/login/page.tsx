import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import type { AuthNotice } from "@/lib/auth/types";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your EstateHub account.",
  robots: { index: false },
};

// Messages for known ?error= / ?notice= values (set by /auth/confirm). Unknown values are ignored.
const ERRORS: Record<string, string> = {
  confirmation:
    "That confirmation link is invalid or has expired. Try logging in, or sign up again to get a new link.",
};
const NOTICES: Record<string, string> = {
  "email-confirmed": "Your email is confirmed. Log in to continue.",
};

function pageNotice(error: unknown, notice: unknown): AuthNotice | undefined {
  if (typeof error === "string" && ERRORS[error]) return { tone: "error", message: ERRORS[error] };
  if (typeof notice === "string" && NOTICES[notice])
    return { tone: "success", message: NOTICES[notice] };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const notice = pageNotice(params.error, params.notice);
  const signupHref = next === "/" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to EstateHub"
      description="Pick up your property search where you left off."
      footer={
        <>
          New to EstateHub?{" "}
          <Link href={signupHref} className="font-medium text-gold-strong underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} notice={notice} />
    </AuthShell>
  );
}
