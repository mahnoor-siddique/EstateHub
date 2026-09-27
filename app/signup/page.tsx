import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { loginPath, postLoginPath } from "@/lib/auth/routes";
import { redirectIfSignedIn } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your free EstateHub account to connect with agents and book viewings.",
  robots: { index: false },
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  await redirectIfSignedIn(params.next);

  const next = postLoginPath(params.next);
  const loginHref = loginPath(next);

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Join EstateHub to find verified homes and connect with trusted agents."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-gold-strong underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
