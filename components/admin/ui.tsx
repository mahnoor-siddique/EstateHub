import Link from "next/link";
import type { ReactNode } from "react";
import { FormAlert } from "@/components/auth/AuthFields";
import { ArrowLeftIcon } from "@/components/ui/icons";

/** Title block for an admin page: optional back link, eyebrow, heading, intro and actions. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header>
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-navy transition-colors hover:text-gold-strong"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-balance break-words sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-base leading-relaxed text-stone">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/** One-off confirmation after a redirect (e.g. "Property deleted."), from a ?saved= query value. */
export function AdminNotice({ message, tone = "success" }: { message?: string; tone?: "success" | "error" | "info" }) {
  if (!message) return null;
  return (
    <div className="mt-6 [&>div]:mb-0">
      <FormAlert message={message} tone={tone} />
    </div>
  );
}

/** A titled white card section of an admin page. */
export function AdminSection({
  id,
  title,
  description,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={
        tone === "danger"
          ? "mt-8 rounded-card border border-danger/30 bg-white p-5 shadow-card sm:p-6"
          : "mt-8 rounded-card border border-line bg-white p-5 shadow-card sm:p-6"
      }
    >
      <h2 id={id} className="text-2xl font-semibold">
        {title}
      </h2>
      {description && <div className="mt-2 text-sm leading-relaxed text-stone">{description}</div>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Centered empty state with an icon, text and an optional action. */
export function AdminEmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-card border border-line bg-white px-6 py-14 text-center shadow-card">
      <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">{icon}</span>
      <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-md text-base leading-relaxed text-stone">{children}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

/** Danger-styled classes for destructive buttons (added to the secondary Button variant). */
export const dangerButtonClass =
  "border-danger text-danger hover:bg-danger hover:text-white disabled:hover:bg-transparent disabled:hover:text-danger";
