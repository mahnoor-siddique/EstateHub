import type { SessionUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";

/** Best available display name: full name, else the part of the email before the "@". */
export function displayName(user: SessionUser): string {
  return user.fullName ?? (user.email.split("@")[0] || "Account");
}

/** Up to two initials, e.g. "Ayesha Khan" -> "AK". */
function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Round initials avatar in the navy/gold brand colours. Decorative — pair it with visible text. */
export function UserAvatar({ user, className }: { user: SessionUser; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold tracking-wide text-gold",
        className,
      )}
    >
      {initials(displayName(user))}
    </span>
  );
}

/**
 * "Signed in as" indicator. `compact` (desktop navbar) shows the avatar and first name only;
 * the full version (mobile menu) adds the full name and email.
 */
export function UserBadge({ user, compact = false }: { user: SessionUser; compact?: boolean }) {
  const name = displayName(user);

  if (compact) {
    return (
      <p className="flex min-w-0 items-center gap-2.5" title={user.email || undefined}>
        <UserAvatar user={user} />
        <span className="max-w-[10rem] truncate text-sm font-medium text-navy">
          <span className="sr-only">Signed in as </span>
          {name.split(" ")[0]}
        </span>
      </p>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} className="size-11 text-sm" />
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-stone uppercase">Signed in as</p>
        <p className="truncate font-serif text-lg text-navy">{name}</p>
        {user.email && <p className="truncate text-sm text-stone">{user.email}</p>}
      </div>
    </div>
  );
}
