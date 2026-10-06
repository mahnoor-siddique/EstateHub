"use client";

import Image from "next/image";
import { useActionState, useState, type FormEvent } from "react";
import { FieldFrame, FormAlert, describedBy } from "@/components/auth/AuthFields";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/admin/types";
import { cn } from "@/lib/utils/cn";
import { AGENCY_MAX, AGENT_NAME_MAX, AGENT_TITLE_MAX, BIO_MAX, type AgentField } from "@/lib/validations/admin-agent";
import { IMAGE_ACCEPT, imageTooLargeError } from "@/lib/validations/image-upload";

type State = AdminFormState<AgentField | "photo">;
type Action = (state: State, formData: FormData) => Promise<State>;

const initialState: State = { status: "idle" };

/**
 * Add/edit form for an agent, including their profile photo. Posts to a Server Action that
 * validates everything (the photo's real file type included) and stores the photo in the
 * AWS S3 image bucket.
 */
export function AgentForm({
  action,
  initialValues,
  currentPhoto,
  submitLabel,
  pendingLabel,
}: {
  action: Action;
  initialValues: Record<string, string>;
  currentPhoto?: string | null;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useFocusFirstError(state);

  const errors = state.status === "error" ? state : undefined;
  const values = errors?.values ?? initialValues;
  const fe = errors?.fieldErrors ?? {};
  const key = errors ? JSON.stringify(values) : "initial";
  // Set by the size pre-check below; otherwise the Server Action's photo error (if any) shows.
  const [sizeError, setSizeError] = useState<string | null>(null);
  const photoError = sizeError ?? fe.photo;

  // Don't send a photo over 5 MB at all: the server would reject it anyway, and a large enough
  // file would exceed the request size limit before the action could reply with a form error.
  function checkPhotoSize(event: FormEvent<HTMLFormElement>) {
    const error = imageTooLargeError(new FormData(event.currentTarget).get("photo"));
    setSizeError(error);
    if (error) {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLInputElement>("#admin-photo")?.focus();
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={checkPhotoSize} noValidate className="space-y-8">
      <FormAlert message={errors?.message ?? (errors ? "Please fix the highlighted fields." : undefined)} />
      {state.status === "success" && <FormAlert tone="success" message={state.message} />}

      <fieldset key={`details-${key}`} className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl text-navy">Details</legend>
        <TextField label="Full name" name="full_name" required maxLength={AGENT_NAME_MAX} autoComplete="off" defaultValue={values.full_name} error={fe.full_name} />
        <TextField label="Title" name="title" maxLength={AGENT_TITLE_MAX} defaultValue={values.title} error={fe.title} hint="Optional, e.g. Senior Property Consultant." />
        <TextField label="Email" name="email" type="email" maxLength={254} autoComplete="off" defaultValue={values.email} error={fe.email} hint="Optional." />
        <TextField label="Phone" name="phone" type="tel" maxLength={30} autoComplete="off" defaultValue={values.phone} error={fe.phone} hint="Optional." />
        <div className="sm:col-span-2">
          <TextField label="Agency" name="agency_name" maxLength={AGENCY_MAX} defaultValue={values.agency_name} error={fe.agency_name} hint="Optional." />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField label="Bio" name="bio" rows={5} maxLength={BIO_MAX} defaultValue={values.bio} error={fe.bio} hint="Optional. One or two sentences for the agent directory." />
        </div>
      </fieldset>

      <fieldset className="border-t border-line pt-8">
        <legend className="mb-4 font-serif text-xl text-navy">Profile photo</legend>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {currentPhoto && (
            <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-sand ring-4 ring-white shadow-card">
              <Image src={currentPhoto} alt="Current profile photo" fill sizes="112px" className="object-cover object-[32%_50%]" />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <FieldFrame
              id="admin-photo"
              label={currentPhoto ? "Replace photo" : "Photo"}
              error={photoError}
              hint="Optional. JPEG, PNG or WebP, up to 5 MB. Without a photo, the agent's initials are shown."
            >
              <input
                id="admin-photo"
                name="photo"
                type="file"
                accept={IMAGE_ACCEPT}
                aria-invalid={photoError ? true : undefined}
                aria-describedby={describedBy("admin-photo", photoError, "hint")}
                onChange={() => setSizeError(null)}
                className={cn(
                  fieldClass,
                  "h-auto cursor-pointer bg-white py-2.5 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory",
                  photoError && "border-danger",
                )}
              />
            </FieldFrame>
            {currentPhoto && <CheckboxField name="removePhoto" label="Remove the current photo" />}
          </div>
        </div>
      </fieldset>

      <div className="border-t border-line pt-6">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />}
          <span aria-live="polite">{pending ? pendingLabel : submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
