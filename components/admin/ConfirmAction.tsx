"use client";

import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";
import { FormAlert } from "@/components/auth/AuthFields";
import { dangerButtonClass } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import type { AdminFormState } from "@/lib/admin/types";
import { cn } from "@/lib/utils/cn";

type Action = (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;

const initialState: AdminFormState = { status: "idle" };

/**
 * A destructive action behind a confirmation step. The trigger opens a native modal <dialog>
 * (focus is kept inside it, Escape closes it, and focus returns to the trigger); the dialog's form
 * posts to the Server Action, which re-checks everything itself. The dialog closes on success and
 * shows any error inside it. Cancel is focused first, so Enter never deletes by accident.
 */
export function ConfirmAction({
  triggerLabel,
  title,
  description,
  confirmLabel,
  pendingLabel,
  action,
  fields,
  acknowledge,
  triggerClassName,
  size = "md",
}: {
  triggerLabel: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  action: Action;
  fields: Record<string, string>;
  /** When set, a required checkbox with this label must be ticked before confirming. */
  acknowledge?: string;
  triggerClassName?: string;
  size?: "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const acknowledgeId = useId();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <Button
        variant="secondary"
        size={size}
        onClick={() => dialogRef.current?.showModal()}
        className={cn(dangerButtonClass, triggerClassName)}
      >
        {triggerLabel}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-line bg-white p-0 text-charcoal shadow-lift backdrop:bg-navy/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="p-6 sm:p-7">
          <h2 id={titleId} className="text-2xl font-semibold">
            {title}
          </h2>
          <div id={descriptionId} className="mt-3 space-y-2 text-sm leading-relaxed text-stone">
            {description}
          </div>

          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          {acknowledge && (
            <label htmlFor={acknowledgeId} className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
              <input
                id={acknowledgeId}
                type="checkbox"
                name="acknowledge"
                required
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-danger"
              />
              <span>{acknowledge}</span>
            </label>
          )}

          {state.status === "error" && (
            <div className="mt-5 [&>div]:mb-0">
              <FormAlert message={state.message} />
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" autoFocus onClick={() => dialogRef.current?.close()} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={pending} className={dangerButtonClass}>
              {pending && (
                <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              )}
              <span aria-live="polite">{pending ? pendingLabel : confirmLabel}</span>
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
