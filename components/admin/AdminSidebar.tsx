"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSectionIcon } from "@/components/admin/AdminSectionIcon";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserAvatar, displayName } from "@/components/auth/UserBadge";
import { ADMIN_SECTIONS } from "@/lib/admin/navigation";
import type { AdminUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";

const itemClasses =
  "flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap";

/**
 * Admin navigation: the signed-in admin, the section links and Sign out. A column beside the
 * content on large screens; stacked above it, with a horizontally scrolling section list, on
 * smaller ones. Sections that are not built yet are listed but not linked.
 *
 * A client component only for active-link highlighting. The admin passed in has already been
 * verified on the server by requireAdmin.
 */
export function AdminSidebar({ admin }: { admin: AdminUser }) {
  const pathname = usePathname();

  return (
    <aside className="rounded-card border border-line bg-white p-4 shadow-card lg:sticky lg:top-28 lg:p-5">
      <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
        EstateHub Admin
      </p>

      <div className="mt-4 flex min-w-0 items-center gap-3">
        <UserAvatar user={admin} className="size-11 text-sm" />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-stone uppercase">Signed in as</p>
          <p className="truncate font-serif text-lg text-navy">{displayName(admin)}</p>
          {admin.email && <p className="truncate text-sm text-stone">{admin.email}</p>}
        </div>
      </div>

      <nav aria-label="Admin" className="mt-5 border-t border-line pt-4">
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {ADMIN_SECTIONS.map(({ id, label, href, available }) => {
            if (!available) {
              return (
                <li key={id}>
                  <span className={cn(itemClasses, "cursor-default text-stone")}>
                    <AdminSectionIcon id={id} className="size-5 shrink-0" />
                    {label}
                    <span className="ml-auto rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }
            const active = pathname === href;
            return (
              <li key={id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    itemClasses,
                    "transition-colors duration-200",
                    active ? "bg-navy text-ivory" : "text-charcoal hover:bg-sand hover:text-navy",
                  )}
                >
                  <AdminSectionIcon id={id} className={cn("size-5 shrink-0", active && "text-gold")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-line pt-4">
        <SignOutButton className="w-full" />
      </div>
    </aside>
  );
}
