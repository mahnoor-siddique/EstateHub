import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentForm } from "@/components/admin/AgentForm";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { AdminNotice, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { deleteAgent, updateAgent } from "@/lib/admin/agents/actions";
import { getAdminAgent, getAgentDependents, getAgentProperties } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

const NOTICES: Record<string, { message: string; tone: "success" | "error" }> = {
  created: { message: "Agent added.", tone: "success" },
  "created-photo-failed": {
    message: "Agent added, but the photo couldn't be uploaded. Try uploading it again below.",
    tone: "error",
  },
};

export async function generateMetadata({ params }: PageProps<"/admin/agents/[id]">): Promise<Metadata> {
  await requireAdmin(`/admin/agents/${(await params).id}`);
  return { title: "Edit agent" };
}

/*
 * /admin/agents/[id] — edit an agent or delete them. The schema does not allow deleting an agent
 * who still has properties or viewing requests, so the page explains what must happen first
 * instead of offering a delete that would fail.
 */
export default async function EditAgentPage({ params, searchParams }: PageProps<"/admin/agents/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/agents/${id}`);

  const agent = await getAdminAgent(id);
  if (!agent) notFound();
  const [dependents, properties, { saved }] = await Promise.all([
    getAgentDependents(id),
    getAgentProperties(id),
    searchParams,
  ]);
  const notice = typeof saved === "string" ? NOTICES[saved] : undefined;

  const initialValues = {
    full_name: agent.fullName,
    title: agent.title ?? "",
    email: agent.email ?? "",
    phone: agent.phone ?? "",
    agency_name: agent.agencyName ?? "",
    bio: agent.bio ?? "",
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Agents"
        title={agent.fullName}
        back={{ href: "/admin/agents", label: "Back to agents" }}
        actions={
          <ButtonLink href={`/agents/${agent.id}`} variant="secondary">
            View on site
          </ButtonLink>
        }
      />
      <AdminNotice message={notice?.message} tone={notice?.tone} />

      <AdminSection id="agent-form-heading" title="Agent details">
        <AgentForm
          action={updateAgent.bind(null, agent.id)}
          initialValues={initialValues}
          currentPhoto={agent.profileImage}
          submitLabel="Save changes"
          pendingLabel="Saving…"
        />
      </AdminSection>

      <AdminSection id="agent-properties-heading" title="Assigned properties">
        {properties.length === 0 ? (
          <p className="text-sm text-stone">No properties are assigned to this agent.</p>
        ) : (
          <ul className="divide-y divide-line">
            {properties.map((property) => (
              <li key={property.id} className="flex min-h-11 items-center justify-between gap-4 py-2">
                <span className="min-w-0 truncate text-charcoal">{property.title}</span>
                <Link
                  href={`/admin/properties/${property.id}`}
                  className="shrink-0 text-sm font-medium text-navy underline-offset-4 hover:text-gold-strong hover:underline"
                >
                  Edit<span className="sr-only"> {property.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection id="agent-delete-heading" title="Delete agent" tone="danger">
        {dependents.properties > 0 ? (
          <p className="text-sm leading-relaxed text-charcoal">
            {agent.fullName} still handles {dependents.properties}{" "}
            {dependents.properties === 1 ? "property" : "properties"}. To delete this agent, first assign{" "}
            {dependents.properties === 1 ? "it" : "them"} to another agent (or delete{" "}
            {dependents.properties === 1 ? "it" : "them"}) using the links above.
          </p>
        ) : dependents.bookings > 0 ? (
          <p className="text-sm leading-relaxed text-charcoal">
            {agent.fullName} is named on {dependents.bookings} viewing{" "}
            {dependents.bookings === 1 ? "request" : "requests"}. Viewing requests keep their agent on record, so this
            agent can&apos;t be deleted.
          </p>
        ) : (
          <ConfirmAction
            triggerLabel="Delete agent"
            title={`Delete ${agent.fullName}?`}
            description={
              <>
                <p>This permanently removes the agent from the site, including their uploaded profile photo. It can&apos;t be undone.</p>
                {dependents.contactRequests > 0 && (
                  <p>
                    {dependents.contactRequests} {dependents.contactRequests === 1 ? "enquiry keeps" : "enquiries keep"} its
                    message but will no longer name this agent.
                  </p>
                )}
              </>
            }
            confirmLabel="Delete agent"
            pendingLabel="Deleting…"
            action={deleteAgent}
            fields={{ agentId: agent.id }}
          />
        )}
      </AdminSection>
    </>
  );
}
