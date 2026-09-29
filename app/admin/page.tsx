import type { Metadata } from "next";
import { AdminSectionIcon } from "@/components/admin/AdminSectionIcon";
import { displayName } from "@/components/auth/UserBadge";
import { ADMIN_SECTIONS } from "@/lib/admin/navigation";
import { requireAdmin } from "@/lib/auth/session";

// Metadata is resolved separately from the page, so it runs the admin check too; otherwise a
// non-admin's 404 would still carry this page's title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin");
  return { title: "Admin dashboard" };
}

/*
 * /admin — the admin dashboard. For now it only introduces the management areas that are coming;
 * it reads no data beyond the admin's own profile. requireAdmin runs here as well as in the layout
 * (deduped per request), so this page never renders for someone who is not an admin.
 */
export default async function AdminDashboardPage() {
  const admin = await requireAdmin("/admin");
  const upcoming = ADMIN_SECTIONS.filter((section) => !section.available);

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">Dashboard</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          Welcome, {displayName(admin)}. This is where you will manage EstateHub&apos;s listings,
          agents, viewings, enquiries and accounts.
        </p>
      </header>

      <section aria-labelledby="admin-sections-heading" className="mt-10">
        <h2 id="admin-sections-heading" className="text-2xl font-semibold">
          Management areas
        </h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map(({ id, label, description }) => (
            <li key={id} className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-sand text-gold-strong">
                  <AdminSectionIcon id={id} className="size-5" />
                </span>
                <span className="rounded-full bg-sand px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-stone uppercase">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{description}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
