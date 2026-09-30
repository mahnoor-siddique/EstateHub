"use client"; // Error boundaries must be Client Components

import { Button, ButtonLink } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";

/**
 * Shown inside the admin shell when an admin page fails to load or an action fails unexpectedly
 * (e.g. Supabase is unreachable). In production Next.js replaces the server error message with a
 * generic one, so no query details reach the browser; the digest matches the server logs.
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-line bg-white px-6 py-14 text-center shadow-card">
      <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
        <AlertIcon className="size-7" />
      </span>
      <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold text-balance">We couldn&apos;t load this page</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-stone">
        Nothing was changed. This is usually temporary, so please try again in a moment.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/admin" variant="secondary">
          Admin dashboard
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-stone">Reference: {error.digest}</p>}
    </div>
  );
}
