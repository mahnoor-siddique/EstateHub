import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { CheckIcon } from "@/components/ui/icons";
import heroImage from "@/public/images/properties-hero.jpg";

const BENEFITS = [
  "Browse verified listings in Lahore, Islamabad, Karachi and more",
  "Connect directly with trusted local agents",
  "One secure account for your whole property search",
];

/**
 * Shared layout for /login and /signup: a form card, plus a photo panel beside it on large
 * screens. Below lg only the card is shown, so the form is the first thing on a phone.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-sand/50">
      <Container className="grid items-stretch gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-14 lg:py-20">
        <aside className="on-dark relative isolate hidden min-h-[36rem] overflow-hidden rounded-card bg-navy text-white shadow-card lg:flex lg:flex-col lg:justify-end">
          <Image
            src={heroImage}
            alt=""
            fill
            placeholder="blur"
            sizes="(min-width: 1280px) 45vw, 50vw"
            className="-z-20 object-cover object-[60%_40%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/60 to-navy/10"
          />
          <div className="p-10 xl:p-12">
            <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">EstateHub</p>
            <p className="mt-3 max-w-md font-serif text-3xl leading-tight font-semibold text-balance xl:text-4xl">
              Modern living. Brighter tomorrows.
            </p>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-white/90">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold text-navy">
                    <CheckIcon className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-none">
          <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone sm:text-base">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-stone">{footer}</div>}
        </div>
      </Container>
    </div>
  );
}
