import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
};

/** Eyebrow + large serif heading + optional intro. Reused by every page section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-strong">
          {eyebrow}
        </p>
      )}
      <Tag className="text-3xl font-semibold sm:text-4xl lg:text-5xl">{title}</Tag>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-stone sm:text-lg">{description}</p>
      )}
    </div>
  );
}
