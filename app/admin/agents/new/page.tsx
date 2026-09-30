import type { Metadata } from "next";
import { AgentForm } from "@/components/admin/AgentForm";
import { AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { createAgent } from "@/lib/admin/agents/actions";
import { requireAdmin } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/agents/new");
  return { title: "Add agent" };
}

/* /admin/agents/new — add an agent (and optionally their photo). */
export default async function NewAgentPage() {
  await requireAdmin("/admin/agents/new");

  return (
    <>
      <AdminPageHeader
        eyebrow="Agents"
        title="Add agent"
        description="New agents appear in the public agent directory and can be assigned to properties."
        back={{ href: "/admin/agents", label: "Back to agents" }}
      />
      <AdminSection id="agent-form-heading" title="Agent details">
        <AgentForm action={createAgent} initialValues={{}} submitLabel="Add agent" pendingLabel="Adding…" />
      </AdminSection>
    </>
  );
}
