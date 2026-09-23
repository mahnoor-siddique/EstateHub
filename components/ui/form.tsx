import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

/** Shared input/select look for the search and filter forms (48px tall = comfortable touch target). */
export const fieldClass =
  "h-12 w-full rounded-lg border border-line bg-ivory px-3 text-sm text-charcoal placeholder:text-stone/80 transition-colors hover:border-gold focus-visible:border-gold-strong";

/** Visible label above a control. */
export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-navy uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Native <select> with the site styling and a decorative chevron. */
export function Select({ className, defaultValue = "", ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <div className="relative">
      <select
        defaultValue={defaultValue}
        className={cn(fieldClass, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone" />
    </div>
  );
}

/** Whole-number PKR input. Text + numeric keyboard avoids the spinner and scroll-wheel quirks of type="number". */
export function PriceInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      className={cn(fieldClass, className)}
      {...props}
    />
  );
}
