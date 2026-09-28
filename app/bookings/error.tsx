"use client"; // Error boundaries must be Client Components

import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CalendarCheckIcon } from "@/components/ui/icons";

/**
 * Shown when loading the bookings fails (e.g. Supabase is unreachable). In production Next.js
 * replaces the server error message with a generic one, so no booking data or query details reach
 * the browser; the digest matches the full error in the server logs.
 */
export default function BookingsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-20 sm:py-28">
      <div role="alert" className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
          <CalendarCheckIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">
          We couldn&apos;t load your bookings
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone sm:text-lg">
          Your viewing requests are safe. This is usually temporary, so please try again in a moment.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => retry()}>Try again</Button>
          <ButtonLink href="/properties" variant="secondary">
            Browse properties
          </ButtonLink>
        </div>
        {error.digest && <p className="mt-6 text-xs text-stone">Reference: {error.digest}</p>}
      </div>
    </Container>
  );
}
