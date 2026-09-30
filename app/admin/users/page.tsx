import type { Metadata } from "next";
import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/ui";
import { UsersIcon } from "@/components/ui/icons";
import { getAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/validations/admin-user";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/users");
  return { title: "Users" };
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "border-navy bg-navy text-white",
  agent: "border-gold/60 bg-sand text-navy",
  user: "border-line bg-white text-charcoal",
};

const joinedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

/*
 * /admin/users — every registered account (from public.profiles) with its role. Admins can change
 * other accounts' roles; their own row has no control, so they cannot remove their own admin
 * access (the Server Action and a database trigger enforce this too). No auth data is shown.
 */
export default async function AdminUsersPage() {
  const admin = await requireAdmin("/admin/users");
  const users = await getAdminUsers();
  const counts = USER_ROLES.map((role) => ({ role, count: users.filter((user) => user.role === role).length }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Users"
        description="Registered accounts, newest first. A role decides what an account can do: admins manage the whole site."
      />

      {users.length === 0 ? (
        <AdminEmptyState icon={<UsersIcon className="size-7" />} title="No accounts yet">
          Accounts appear here as soon as people sign up.
        </AdminEmptyState>
      ) : (
        <section aria-labelledby="all-users-heading" className="mt-10">
          <h2 id="all-users-heading" className="flex items-baseline gap-3 text-2xl font-semibold">
            All accounts
            <span className="font-sans text-sm font-medium text-stone">{users.length}</span>
          </h2>
          <p className="mt-2 text-sm text-stone">
            {counts.map(({ role, count }) => `${count} ${USER_ROLE_LABELS[role].toLowerCase()}${count === 1 ? "" : "s"}`).join(" · ")}
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            {users.map((user) => {
              const isSelf = user.id === admin.id;
              const label = user.fullName || user.email || "this account";
              return (
                <li key={user.id} className="rounded-card border border-line bg-white p-5 shadow-card">
                  <article aria-labelledby={`user-${user.id}`}>
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
                              ROLE_STYLES[user.role],
                            )}
                          >
                            {USER_ROLE_LABELS[user.role]}
                          </span>
                          {isSelf && <span className="text-xs font-semibold tracking-wide text-gold-strong uppercase">You</span>}
                        </div>
                        <h3 id={`user-${user.id}`} className="mt-3 text-xl font-semibold break-words">
                          {user.fullName || <span className="text-stone">No name given</span>}
                        </h3>
                        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                          <div className="min-w-0">
                            <dt className="text-xs font-semibold tracking-wide text-stone uppercase">Email</dt>
                            <dd className="mt-0.5 truncate text-charcoal">
                              {user.email ? (
                                <a href={`mailto:${user.email}`} className="text-navy underline-offset-4 hover:underline">
                                  {user.email}
                                </a>
                              ) : (
                                "—"
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold tracking-wide text-stone uppercase">Joined</dt>
                            <dd className="mt-0.5 text-charcoal">{joinedFormat.format(new Date(user.createdAt))}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="md:shrink-0">
                        {isSelf ? (
                          <p className="max-w-xs text-sm text-stone">
                            This is your account. You can&apos;t change your own role, so you can&apos;t lock yourself out.
                          </p>
                        ) : (
                          <UserRoleForm userId={user.id} accountLabel={label} role={user.role} />
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
