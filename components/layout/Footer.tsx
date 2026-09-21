import Link from "next/link";
import { CITIES, NAV_LINKS, SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

const linkClass =
  "inline-flex min-h-8 items-center text-sm text-white/75 transition-colors hover:text-gold";

/** Site footer. Server component: no client JS. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark mt-auto bg-navy text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:py-16">
        <div className="max-w-sm">
          <Logo tone="light" />
          <p className="mt-5 text-sm leading-relaxed text-white/75">
            Verified properties for sale and rent across Pakistan&apos;s favorite cities, with
            trusted agents and simple viewing bookings.
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2
            id="footer-explore"
            className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-gold"
          >
            Explore
          </h2>
          <ul className="mt-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-cities">
          <h2
            id="footer-cities"
            className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-gold"
          >
            Popular cities
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-1 lg:grid-cols-2">
            {CITIES.map((city) => (
              <li key={city}>
                <Link href={`/properties?city=${encodeURIComponent(city)}`} className={linkClass}>
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-white/10">
        <Container className="py-6">
          <p className="text-xs text-white/60">
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
