import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "md" | "lg";

const base =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow] duration-200 touch-manipulation " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-navy shadow-sm hover:bg-[#d3b07b] active:bg-[#b98f55]",
  secondary: "border border-navy bg-transparent text-navy hover:bg-navy hover:text-ivory",
  ghost: "text-charcoal hover:bg-sand hover:text-navy",
  onDark: "border border-white/40 text-white hover:border-white hover:bg-white/10",
};

// min-h keeps every button at a 44px+ touch target.
const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
};

type StyleProps = { variant?: Variant; size?: Size };

/** Shared class builder so buttons and link-buttons always look identical. */
export function buttonClasses(
  { variant = "primary", size = "md" }: StyleProps,
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

/** A real <button>: use for actions (submit, toggle). */
export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentPropsWithoutRef<"button">) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

/** A real <a> (via next/link): use for navigation. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: StyleProps & ComponentPropsWithoutRef<typeof Link>) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}
