"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/auth/actions";
import type { SignOutState } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";

const initialState: SignOutState = { status: "idle" };

/**
 * Sign out via the signOut Server Action. A form (not an onClick fetch) so it works before
 * hydration too. On success the action redirects home; on failure the error is shown here —
 * `errorPlacement="popover"` floats it under the button (desktop navbar row), `"inline"` stacks it
 * below (mobile menu).
 */
export function SignOutButton({
  variant = "secondary",
  errorPlacement = "inline",
  className,
}: {
  variant?: "secondary" | "ghost";
  errorPlacement?: "popover" | "inline";
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(signOut, initialState);

  return (
    <form action={formAction} className={cn("relative", className)}>
      <Button type="submit" variant={variant} disabled={pending} className="w-full">
        {pending && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          />
        )}
        <span aria-live="polite">{pending ? "Signing out…" : "Sign out"}</span>
      </Button>

      {state.status === "error" && (
        <p
          role="alert"
          className={cn(
            "flex items-start gap-2 text-sm text-danger",
            errorPlacement === "popover"
              ? "absolute top-full right-0 z-10 mt-2 w-64 rounded-lg border border-danger/30 bg-white p-3 shadow-lift"
              : "mt-2",
          )}
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}
    </form>
  );
}
