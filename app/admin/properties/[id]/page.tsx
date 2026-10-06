import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { PropertyImageManager } from "@/components/admin/PropertyImageManager";
import { AdminNotice, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { uploadPropertyImage } from "@/lib/admin/images/actions";
import { deleteProperty, updateProperty } from "@/lib/admin/properties/actions";
import { getAdminProperty, getAgentOptions, getPropertyDependents } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

const NOTICES: Record<string, string> = {
  created: "Property added. Now upload its photos below — the first photo becomes the cover.",
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export async function generateMetadata({ params }: PageProps<"/admin/properties/[id]">): Promise<Metadata> {
  await requireAdmin(`/admin/properties/${(await params).id}`);
  return { title: "Edit property" };
}

/*
 * /admin/properties/[id] — edit a listing, manage its photos, or delete it. The delete dialog
 * says exactly what goes with it (per the schema's foreign keys) before anything happens.
 */
export default async function EditPropertyPage({ params, searchParams }: PageProps<"/admin/properties/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/properties/${id}`);

  const property = await getAdminProperty(id);
  if (!property) notFound();
  const [agents, dependents, { saved }] = await Promise.all([getAgentOptions(), getPropertyDependents(id), searchParams]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Properties"
        title={property.title}
        back={{ href: "/admin/properties", label: "Back to properties" }}
        actions={
          <ButtonLink href={`/properties/${property.id}`} variant="secondary">
            View on site
          </ButtonLink>
        }
      />
      <AdminNotice message={typeof saved === "string" ? NOTICES[saved] : undefined} />

      <AdminSection id="property-form-heading" title="Property details">
        <PropertyForm
          action={updateProperty.bind(null, property.id)}
          initialValues={property.values}
          agents={agents}
          submitLabel="Save changes"
          pendingLabel="Saving…"
        />
      </AdminSection>

      <AdminSection
        id="property-photos-heading"
        title="Photos"
        description="New photos are stored in AWS S3. The first photo is the cover on listing cards."
      >
        <PropertyImageManager images={property.images} uploadAction={uploadPropertyImage.bind(null, property.id)} />
      </AdminSection>

      <AdminSection
        id="property-delete-heading"
        title="Delete property"
        tone="danger"
        description={
          <p>
            If the property is no longer on the market, consider marking it Sold or Rented instead: deleting it also
            removes its photos and every viewing request made for it.
          </p>
        }
      >
        <ConfirmAction
          triggerLabel="Delete property"
          title={`Delete “${property.title}”?`}
          description={
            <>
              <p>This permanently deletes the listing. It can&apos;t be undone. Along with it:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>{plural(dependents.images, "photo is", "photos are")} deleted, including the files in storage.</li>
                <li>
                  {plural(dependents.bookings, "viewing request is", "viewing requests are")} deleted
                  {dependents.activeBookings > 0 && ` (${dependents.activeBookings} still pending or confirmed)`}.
                </li>
                <li>{plural(dependents.contactRequests, "enquiry keeps", "enquiries keep")} its message but no longer links to this property.</li>
              </ul>
            </>
          }
          confirmLabel="Delete property"
          pendingLabel="Deleting…"
          action={deleteProperty}
          fields={{ propertyId: property.id, confirmedBookings: String(dependents.bookings) }}
          acknowledge={
            dependents.bookings > 0
              ? `I understand that ${plural(dependents.bookings, "viewing request", "viewing requests")} will be deleted.`
              : undefined
          }
        />
      </AdminSection>
    </>
  );
}
