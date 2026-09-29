import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/auth/session";

// No title template here: this metadata also applies to the 404 that non-admins get, which must
// not hint that an admin area exists. Each admin page sets its own title.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/*
 * Shell for every /admin page. requireAdmin sends guests to /login?next=/admin and gives everyone
 * who is not an admin a 404. Each admin page must still call requireAdmin itself: a layout does
 * not stop its child segments from rendering (see the Next.js authentication guide).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin("/admin");

  return (
    <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10 lg:py-12">
      <AdminSidebar admin={admin} />
      <div className="min-w-0">{children}</div>
    </Container>
  );
}
