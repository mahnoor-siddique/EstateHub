"use client";

import { useActionState, useId } from "react";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { updatePropertyStatus } from "@/lib/admin/properties/actions";
import type { AdminFormState } from "@/lib/admin/types";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABELS } from "@/lib/validations/admin-property";
import type { Database } from "@/types/database";

const initialState: AdminFormState = { status: "idle" };

/** Status dropdown + Update button for one property on the admin list. */
export function PropertyStatusForm({
  propertyId,
  propertyTitle,
  status,
}: {
  propertyId: string;
  propertyTitle: string;
  status: Database["public"]["Enums"]["property_status"];
}) {
  const [state, formAction, pending] = useActionState(updatePropertyStatus, initialState);
  const id = useId();

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="propertyId" value={propertyId} />
      <label htmlFor={id} className="sr-only">
        Status of {propertyTitle}
      </label>
      <div className="flex gap-2">
        <div className="w-36">
          <Select id={id} name="status" defaultValue={status} className="h-11 bg-white">
            {PROPERTY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PROPERTY_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending} className="min-h-11 px-4">
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={cn("min-h-5 text-xs", state.status === "error" ? "text-danger" : "text-gold-strong")}
      >
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
