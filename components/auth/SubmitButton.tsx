import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Full-width submit button. While `pending` it is disabled, which also blocks double submits,
 * and shows a spinner with the pending label.
 */
export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full">
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy"
        />
      )}
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </Button>
  );
}
