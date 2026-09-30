import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { FieldFrame, describedBy } from "@/components/auth/AuthFields";
import { Select, fieldClass } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";

/*
 * Labelled admin form controls. Each wires its label, hint and error to the control for screen
 * readers (via the shared FieldFrame), like the site's other forms.
 */

const errorClass = "border-danger hover:border-danger focus-visible:border-danger";

type Common = { label: string; name: string; error?: string; hint?: string; idPrefix?: string };

const fieldId = (prefix: string | undefined, name: string) => `${prefix ?? "admin"}-${name}`;

export function TextField({
  label,
  name,
  error,
  hint,
  idPrefix,
  className,
  ...props
}: Common & Omit<ComponentPropsWithoutRef<"input">, "id" | "name">) {
  const id = fieldId(idPrefix, name);
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(fieldClass, "bg-white text-base sm:text-sm", error && errorClass, className)}
        {...props}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  idPrefix,
  className,
  ...props
}: Common & Omit<ComponentPropsWithoutRef<"textarea">, "id" | "name">) {
  const id = fieldId(idPrefix, name);
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          fieldClass,
          "h-auto min-h-32 bg-white py-3 text-base leading-relaxed sm:text-sm",
          error && errorClass,
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  idPrefix,
  children,
  ...props
}: Common & Omit<ComponentPropsWithoutRef<"select">, "id" | "name"> & { children: ReactNode }) {
  const id = fieldId(idPrefix, name);
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <Select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn("bg-white text-base sm:text-sm", error && errorClass)}
        {...props}
      >
        {children}
      </Select>
    </FieldFrame>
  );
}

/** Checkbox with its label to the right; the whole row is clickable (44px tall). */
export function CheckboxField({
  label,
  name,
  idPrefix,
  ...props
}: { label: ReactNode; name: string; idPrefix?: string } & Omit<ComponentPropsWithoutRef<"input">, "id" | "name" | "type">) {
  const id = fieldId(idPrefix, name);
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-charcoal">
      <input id={id} name={name} type="checkbox" className="size-5 shrink-0 cursor-pointer accent-navy" {...props} />
      <span>{label}</span>
    </label>
  );
}
