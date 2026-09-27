"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { fieldClass } from "@/components/ui/form";
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "id" | "name"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

/** Label, input, optional hint and error message, wired together for screen readers. */
export function AuthField({ label, name, error, hint, className, ...props }: InputProps) {
  const id = `auth-${name}`;
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

/** Password input with a show/hide toggle. */
export function PasswordField({ label, name, error, hint, className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  const id = `auth-${name}`;
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            fieldClass,
            "bg-white pr-12 text-base sm:text-sm",
            error && errorClass,
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-stone transition-colors hover:text-navy"
        >
          {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>
    </FieldFrame>
  );
}

/**
 * Form-level banner: an error (e.g. "Incorrect email or password.") by default, or a
 * `tone="success"` notice (e.g. "Email confirmed").
 */
export function FormAlert({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) return null;
  const success = tone === "success";
  const Icon = success ? CheckIcon : AlertIcon;
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        success
          ? "border-gold/50 bg-sand/60 text-navy"
          : "border-danger/30 bg-danger/5 text-danger",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", success && "text-gold-strong")} />
      <p>{message}</p>
    </div>
  );
}

const errorClass = "border-danger hover:border-danger focus-visible:border-danger";

// The error replaces the hint while shown, so point at whichever one is on screen.
function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

function FieldFrame({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-navy uppercase"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
