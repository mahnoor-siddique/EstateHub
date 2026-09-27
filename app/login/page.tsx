import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your EstateHub account.",
  robots: { index: false },
};

// Messages for known ?error= values (e.g. from /auth/confirm). Unknown values are ignored.
const NOTICES: Record<string, string> = {
  confirmation:
    "That confirmation link is invalid or has expired. Try logging in, or sign up again to get a new link.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const notice = typeof params.error === "string" ? NOTICES[params.error] : undefined;
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
