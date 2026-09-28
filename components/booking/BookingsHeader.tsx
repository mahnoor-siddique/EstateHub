import type { ReactNode } from "react";

/** Title block for /bookings, shared by the page and its loading state. */
export function BookingsHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">My bookings</p>
        <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">Your viewings</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          Every viewing you&apos;ve requested, with its status. New requests stay pending until the
          listing agent confirms them.
        </p>
      </div>
      {children}
    </header>
  );
}
