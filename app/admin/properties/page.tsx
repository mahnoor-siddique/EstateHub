import type { Metadata } from "next";
import Link from "next/link";
import { PropertyStatusForm } from "@/components/admin/PropertyStatusForm";
import { AdminEmptyState, AdminNotice, AdminPageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { HomeIcon } from "@/components/ui/icons";
import { getAdminProperties } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/properties");
  return { title: "Manage properties" };
}

const NOTICES: Record<string, string> = { deleted: "Property deleted." };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

/*
 * /admin/properties — every listing with its key details, a quick status change, and links to
 * edit (where photos and deletion live). requireAdmin runs here, not only in the layout.
 */
export default async function AdminPropertiesPage({ searchParams }: PageProps<"/admin/properties">) {
  await requireAdmin("/admin/properties");
  const [properties, { saved }] = await Promise.all([getAdminProperties(), searchParams]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Properties"
        description="Add, edit and retire listings, change their status and manage their photos."
        actions={<ButtonLink href="/admin/properties/new">Add property</ButtonLink>}
      />
      <AdminNotice message={typeof saved === "string" ? NOTICES[saved] : undefined} />

      {properties.length === 0 ? (
        <AdminEmptyState
          icon={<HomeIcon className="size-7" />}
          title="No properties yet"
          action={<ButtonLink href="/admin/properties/new">Add the first property</ButtonLink>}
        >
          Listings you add here appear on the public Properties page straight away.
        </AdminEmptyState>
      ) : (
        <section aria-labelledby="all-properties-heading" className="mt-10">
          <h2 id="all-properties-heading" className="flex items-baseline gap-3 text-2xl font-semibold">
            All properties
            <span className="font-sans text-sm font-medium text-stone">{properties.length}</span>
          </h2>
          <ul className="mt-5 flex flex-col gap-4">
            {properties.map((property) => (
              <li key={property.id} className="rounded-card border border-line bg-white p-5 shadow-card">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold break-words">
                      <Link href={`/admin/properties/${property.id}`} className="hover:text-gold-strong">
                        {property.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-stone">
                      {property.areaLocation}, {property.city}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                      <Detail term="Type" value={`${property.propertyType} · ${property.listingType}`} />
                      <Detail term="Price" value={formatPrice(property.price, property.listingType)} />
                      <Detail term="Agent" value={property.agent?.fullName ?? "—"} />
                      <Detail term="Created" value={dateFormat.format(new Date(property.createdAt))} />
                      <Detail term="Photos" value={String(property.imageCount)} />
                    </dl>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start xl:flex-col xl:items-end">
                    <PropertyStatusForm propertyId={property.id} propertyTitle={property.title} status={property.status} />
                    <div className="flex gap-2">
                      <ButtonLink href={`/admin/properties/${property.id}`} variant="secondary">
                        Edit<span className="sr-only"> {property.title}</span>
                      </ButtonLink>
                      <ButtonLink href={`/properties/${property.id}`} variant="ghost">
                        View<span className="sr-only"> {property.title} on the site</span>
                      </ButtonLink>
                    </div>
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

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{term}</dt>
      <dd className="mt-0.5 truncate text-charcoal" title={value}>
        {value}
      </dd>
    </div>
  );
}
