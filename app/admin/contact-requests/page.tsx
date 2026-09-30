import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/ui";
import { MessageIcon } from "@/components/ui/icons";
import { getAdminContactRequests } from "@/lib/admin/queries";
import type { ContactRequestKind } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/contact-requests");
  return { title: "Contact requests" };
}

const KINDS: Record<ContactRequestKind, { label: string; plural: string; className: string }> = {
  property: { label: "Property enquiry", plural: "property enquiries", className: "border-navy bg-navy text-white" },
  agent: { label: "Agent enquiry", plural: "agent enquiries", className: "border-gold/60 bg-sand text-navy" },
  general: { label: "General enquiry", plural: "general enquiries", className: "border-line bg-white text-charcoal" },
};

const submittedFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

/*
 * /admin/contact-requests — every enquiry sent through the site, newest first, read-only.
 * requireAdmin runs here (not only in the layout); the database only returns all requests to
 * admins, and nobody can edit or delete them.
 */
export default async function AdminContactRequestsPage() {
  await requireAdmin("/admin/contact-requests");
  const requests = await getAdminContactRequests();
  const counts = (Object.keys(KINDS) as ContactRequestKind[]).map((kind) => ({
    kind,
    count: requests.filter((request) => request.kind === kind).length,
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Contact requests"
        description="Enquiries sent through the site, newest first. Property enquiries are also sent to the listing's agent."
      />

      {requests.length === 0 ? (
        <AdminEmptyState icon={<MessageIcon className="size-7" />} title="No contact requests yet">
          When signed-in visitors contact an agent or ask about a property, their messages appear here.
        </AdminEmptyState>
      ) : (
        <section aria-labelledby="all-requests-heading" className="mt-10">
          <h2 id="all-requests-heading" className="flex items-baseline gap-3 text-2xl font-semibold">
            All requests
            <span className="font-sans text-sm font-medium text-stone">{requests.length}</span>
          </h2>
          <p className="mt-2 text-sm text-stone">
            {counts.map(({ kind, count }) => `${count} ${KINDS[kind].plural}`).join(" · ")}
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            {requests.map((request) => (
              <li key={request.id} className="rounded-card border border-line bg-white p-5 shadow-card">
                <article aria-labelledby={`request-${request.id}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
                        KINDS[request.kind].className,
                      )}
                    >
                      {KINDS[request.kind].label}
                    </span>
                    <span className="text-xs text-stone">{submittedFormat.format(new Date(request.createdAt))}</span>
                  </div>

                  <h3 id={`request-${request.id}`} className="mt-3 text-xl font-semibold break-words">
                    {request.name}
                  </h3>

                  <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Detail term="Email">
                      <a href={`mailto:${request.email}`} className="text-navy underline-offset-4 hover:underline">
                        {request.email}
                      </a>
                    </Detail>
                    <Detail term="Phone">
                      {request.phone ? (
                        <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`} className="text-navy underline-offset-4 hover:underline">
                          {request.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </Detail>
                    <Detail term="Sent by">{request.fromAccount ? "Signed-in account" : "Guest (before sign-in was required)"}</Detail>
                    <Detail term="Property">
                      {request.property ? (
                        <Link href={`/admin/properties/${request.property.id}`} className="text-navy underline-offset-4 hover:underline">
                          {request.property.title}
                          <span className="text-stone"> · {request.property.city}</span>
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Detail>
                    <Detail term="Agent">
                      {request.agent ? (
                        <Link href={`/admin/agents/${request.agent.id}`} className="text-navy underline-offset-4 hover:underline">
                          {request.agent.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Detail>
                  </dl>

                  <div className="mt-4 rounded-lg bg-ivory px-4 py-3 text-sm">
                    <p className="text-xs font-semibold tracking-wide text-stone uppercase">Message</p>
                    <p className="mt-1 whitespace-pre-line break-words text-charcoal">{request.message}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{term}</dt>
      <dd className="mt-0.5 truncate text-charcoal">{children}</dd>
    </div>
  );
}
