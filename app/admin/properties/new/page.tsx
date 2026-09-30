import type { Metadata } from "next";
import { NEW_PROPERTY_VALUES, PropertyForm } from "@/components/admin/PropertyForm";
import { AdminEmptyState, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { UserCheckIcon } from "@/components/ui/icons";
import { createProperty } from "@/lib/admin/properties/actions";
import { getAgentOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/properties/new");
  return { title: "Add property" };
}

/* /admin/properties/new — create a listing. Photos are added on the next screen. */
export default async function NewPropertyPage() {
  await requireAdmin("/admin/properties/new");
  const agents = await getAgentOptions();

  return (
    <>
      <AdminPageHeader
        eyebrow="Properties"
        title="Add property"
        description="Fill in the listing details. You can upload photos once it is saved."
        back={{ href: "/admin/properties", label: "Back to properties" }}
      />
      {agents.length === 0 ? (
        <AdminEmptyState
          icon={<UserCheckIcon className="size-7" />}
          title="Add an agent first"
          action={<ButtonLink href="/admin/agents/new">Add agent</ButtonLink>}
        >
          Every property is handled by an agent, and there are no agents yet.
        </AdminEmptyState>
      ) : (
        <AdminSection id="property-form-heading" title="Property details">
          <PropertyForm
            action={createProperty}
            initialValues={NEW_PROPERTY_VALUES}
            agents={agents}
            submitLabel="Add property"
            pendingLabel="Adding…"
          />
        </AdminSection>
      )}
    </>
  );
}
