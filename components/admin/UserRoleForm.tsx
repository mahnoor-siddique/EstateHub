"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { updateUserRole } from "@/lib/admin/users/actions";
import type { AdminFormState } from "@/lib/admin/types";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/validations/admin-user";

const initialState: AdminFormState = { status: "idle" };

/**
 * Role dropdown + Update button for one account on the admin users list. Choosing Admin for an
 * account that isn't one reveals a required confirmation checkbox (the server checks it too).
 */
export function UserRoleForm({ userId, accountLabel, role }: { userId: string; accountLabel: string; role: UserRole }) {
  const [state, formAction, pending] = useActionState(updateUserRole, initialState);
  const [selected, setSelected] = useState<UserRole>(role);
  const id = useId();
  const confirmId = useId();
  const promotingToAdmin = selected === "admin" && role !== "admin";

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-stone uppercase">
        Role<span className="sr-only"> of {accountLabel}</span>
      </label>
      <div className="flex gap-2">
        <div className="w-32">
          <Select
            id={id}
            name="role"
            defaultValue={role}
            onChange={(event) => setSelected(event.target.value as UserRole)}
            className="h-11 bg-white"
          >
            {USER_ROLES.map((value) => (
              <option key={value} value={value}>
                {USER_ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending} className="min-h-11 px-4">
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      {promotingToAdmin && (
        <label htmlFor={confirmId} className="flex max-w-xs cursor-pointer items-start gap-2 text-xs text-charcoal">
          <input id={confirmId} type="checkbox" name="confirmAdmin" required className="mt-0.5 size-4 shrink-0 accent-navy" />
          <span>I understand this gives {accountLabel} full admin access to EstateHub.</span>
        </label>
      )}
      <p
        aria-live="polite"
        className={cn("min-h-5 max-w-xs text-xs", state.status === "error" ? "text-danger" : "text-gold-strong")}
      >
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
