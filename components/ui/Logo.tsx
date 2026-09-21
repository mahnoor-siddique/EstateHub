import Link from "next/link";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import { HomeIcon } from "./icons";

/** EstateHub wordmark + "Find Your Place" tagline. `tone="light"` is for dark backgrounds. */
export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} - ${SITE.tagline}, home`}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-lg",
          light ? "bg-gold text-navy" : "bg-navy text-gold",
        )}
      >
        <HomeIcon className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-xl font-semibold tracking-tight",
            light ? "text-white" : "text-navy",
          )}
        >
          {SITE.name}
        </span>
        <span
          className={cn(
            "mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.22em]",
            light ? "text-gold" : "text-gold-strong",
          )}
        >
          {SITE.tagline}
        </span>
      </span>
    </Link>
  );
}
