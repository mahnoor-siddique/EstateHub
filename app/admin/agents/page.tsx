import type { Metadata } from "next";
import Link from "next/link";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { AdminEmptyState, AdminNotice, AdminPageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { UserCheckIcon } from "@/components/ui/icons";
import { getAdminAgents } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/agents");
  return { title: "Manage agents" };
}

const NOTICES: Record<string, string> = { deleted: "Agent deleted." };

/* /admin/agents — the agent directory with contact details and how many properties each handles. */
export default async function AdminAgentsPage({ searchParams }: PageProps<"/admin/agents">) {
  await requireAdmin("/admin/agents");
  const [agents, { saved }] = await Promise.all([getAdminAgents(), searchParams]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Agents"
        description="Add and edit the agents shown on the site, and the photos on their profiles."
        actions={<ButtonLink href="/admin/agents/new">Add agent</ButtonLink>}
      />
      <AdminNotice message={typeof saved === "string" ? NOTICES[saved] : undefined} />

      {agents.length === 0 ? (
        <AdminEmptyState
          icon={<UserCheckIcon className="size-7" />}
          title="No agents yet"
          action={<ButtonLink href="/admin/agents/new">Add the first agent</ButtonLink>}
        >
          Every property needs an agent, so start by adding one.
        </AdminEmptyState>
      ) : (
        <section aria-labelledby="all-agents-heading" className="mt-10">
          <h2 id="all-agents-heading" className="flex items-baseline gap-3 text-2xl font-semibold">
            All agents
            <span className="font-sans text-sm font-medium text-stone">{agents.length}</span>
          </h2>
          <ul className="mt-5 grid gap-4 xl:grid-cols-2">
            {agents.map((agent) => (
              <li key={agent.id} className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 shadow-card sm:flex-row">
                <AgentAvatar
                  agent={{
                    id: agent.id,
                    fullName: agent.fullName,
                    agencyName: agent.agencyName ?? "",
                    title: agent.title ?? "",
                    bio: "",
                    profileImage: agent.profileImage ?? undefined,
                  }}
                  className="size-20 text-2xl"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold break-words">
                    <Link href={`/admin/agents/${agent.id}`} className="hover:text-gold-strong">
                      {agent.fullName}
                    </Link>
                  </h3>
                  <p className="text-sm text-stone">
                    {[agent.title, agent.agencyName].filter(Boolean).join(" · ") || "No title or agency"}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Detail term="Email" value={agent.email} />
                    <Detail term="Phone" value={agent.phone} />
                    <Detail term="Properties" value={String(agent.propertyCount)} />
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <ButtonLink href={`/admin/agents/${agent.id}`} variant="secondary">
                      Edit<span className="sr-only"> {agent.fullName}</span>
                    </ButtonLink>
                    <ButtonLink href={`/agents/${agent.id}`} variant="ghost">
                      View<span className="sr-only"> {agent.fullName}&apos;s profile on the site</span>
                    </ButtonLink>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Detail({ term, value }: { term: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{term}</dt>
      <dd className="mt-0.5 truncate text-charcoal" title={value ?? undefined}>
        {value || "—"}
      </dd>
    </div>
  );
}
