"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AUTH_LINKS, NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";

const MENU_ID = "mobile-menu";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sticky site navigation.
 * - lg and up: inline links + Login / Get Started.
 * - below lg (tablet + mobile): logo + hamburger that opens a full-width panel.
 *
 * It is a client component only because of the menu toggle and active-link highlighting.
 */
export function Navbar() {
  const pathname = usePathname();
  // Remember *which page* the menu was opened on. The menu counts as open only while we
  // are still on that page, so navigating anywhere closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedOn(null);
        toggleRef.current?.focus(); // return focus to the control that opened the menu
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-20">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center px-4 text-sm font-medium transition-colors duration-200",
                      "after:absolute after:inset-x-4 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gold after:transition-transform after:duration-200",
                      active
                        ? "text-navy after:scale-x-100"
                        : "text-charcoal hover:text-navy after:scale-x-0 hover:after:scale-x-100",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href={AUTH_LINKS.login.href} variant="ghost">
            {AUTH_LINKS.login.label}
          </ButtonLink>
          <ButtonLink href={AUTH_LINKS.signup.href}>{AUTH_LINKS.signup.label}</ButtonLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={MENU_ID}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenedOn(open ? null : pathname)}
          className="-mr-2 grid size-11 cursor-pointer place-items-center rounded-lg text-navy transition-colors hover:bg-sand lg:hidden"
        >
          {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
        </button>
      </Container>

      {/* Mobile / tablet panel. Kept in the DOM (hidden) so aria-controls always resolves. */}
      <div
        id={MENU_ID}
        hidden={!open}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-ivory shadow-lift lg:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href} className="border-b border-line last:border-b-0">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpenedOn(null)}
                      className={cn(
                        "flex min-h-12 items-center justify-between font-serif text-xl transition-colors",
                        active ? "text-gold-strong" : "text-navy hover:text-gold-strong",
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3 pb-2">
            <ButtonLink
              href={AUTH_LINKS.login.href}
              variant="secondary"
              onClick={() => setOpenedOn(null)}
            >
              {AUTH_LINKS.login.label}
            </ButtonLink>
            <ButtonLink href={AUTH_LINKS.signup.href} onClick={() => setOpenedOn(null)}>
              {AUTH_LINKS.signup.label}
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
