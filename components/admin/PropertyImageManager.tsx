"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { FieldFrame, FormAlert, describedBy } from "@/components/auth/AuthFields";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/form";
import { deletePropertyImage, movePropertyImage, updatePropertyImage } from "@/lib/admin/images/actions";
import type { AdminFormState, AdminPropertyImage } from "@/lib/admin/types";
import { cn } from "@/lib/utils/cn";
import { ALT_TEXT_MAX, IMAGE_ACCEPT, LABEL_MAX, imageTooLargeError } from "@/lib/validations/image-upload";

type State = AdminFormState<"photo" | "alt_text" | "label">;
type Action = (state: State, formData: FormData) => Promise<State>;

const idle: State = { status: "idle" };

/**
 * The photo gallery editor on /admin/properties/[id]: upload new photos (added at the end), edit
 * each photo's description and caption, move photos (the first one is the cover shown on cards),
 * and delete them. Every button posts to an admin-only Server Action.
 */
export function PropertyImageManager({
  images,
  uploadAction,
}: {
  images: AdminPropertyImage[];
  uploadAction: Action;
}) {
  return (
    <div className="space-y-8">
      <UploadForm action={uploadAction} />

      {images.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-ivory px-5 py-6 text-sm text-stone">
          No photos yet. Until one is added, the property shows the designed placeholder for its type.
        </p>
      ) : (
        <ol className="grid gap-5 lg:grid-cols-2" aria-label="Photos in gallery order">
          {images.map((image, index) => (
            <PhotoItem key={image.id} image={image} index={index} count={images.length} />
          ))}
        </ol>
      )}
    </div>
  );
}

function UploadForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? state.values : undefined;
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
      event.currentTarget.querySelector<HTMLInputElement>("#upload-photo")?.focus();
    }
  }

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    else if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={checkPhotoSize} className="rounded-card border border-line bg-ivory p-5">
      <h3 className="text-lg font-semibold">Upload a photo</h3>
      <p className="mt-1 text-sm text-stone">JPEG, PNG or WebP, up to 5 MB. New photos are added at the end.</p>
      <div className="mt-4">
        {state.status === "error" && state.message && <FormAlert message={state.message} />}
        {state.status === "success" && <FormAlert tone="success" message={state.message} />}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldFrame id="upload-photo" label="Photo" error={photoError}>
            <input
              id="upload-photo"
              name="photo"
              type="file"
              required
              accept={IMAGE_ACCEPT}
              aria-invalid={photoError ? true : undefined}
              aria-describedby={describedBy("upload-photo", photoError)}
              onChange={() => setSizeError(null)}
              className={cn(
                fieldClass,
                "h-auto cursor-pointer bg-white py-2.5 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory",
                photoError && "border-danger",
              )}
            />
          </FieldFrame>
        </div>
        <TextField
          idPrefix="upload"
          label="Description (alt text)"
          name="alt_text"
          required
          maxLength={ALT_TEXT_MAX}
          defaultValue={values?.alt_text}
          error={fe.alt_text}
          hint="What the photo shows, for screen readers."
        />
        <TextField
          idPrefix="upload"
          label="Caption"
          name="label"
          maxLength={LABEL_MAX}
          defaultValue={values?.label}
          error={fe.label}
          hint="Optional, e.g. Kitchen."
        />
      </div>
      <Button type="submit" disabled={pending} className="mt-5">
        {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />}
        <span aria-live="polite">{pending ? "Uploading…" : "Upload photo"}</span>
      </Button>
    </form>
  );
}

function PhotoItem({ image, index, count }: { image: AdminPropertyImage; index: number; count: number }) {
  const [state, formAction, pending] = useActionState(updatePropertyImage, idle);
  const [moveState, moveAction, moving] = useActionState(movePropertyImage, idle);
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? state.values : undefined;
  const name = image.label || `Photo ${index + 1}`;
  const prefix = `photo-${image.id}`;

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
      <div className="relative aspect-[16/10] bg-sand">
        <Image src={image.src} alt={image.altText} fill sizes="(min-width: 1024px) 24rem, 100vw" className="object-cover" />
        <span className="absolute top-3 left-3 rounded-full bg-navy/85 px-3 py-1 text-xs font-semibold text-ivory">
          {index === 0 ? "Cover · 1" : index + 1} of {count}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="imageId" value={image.id} />
          <TextField
            idPrefix={prefix}
            label="Description (alt text)"
            name="alt_text"
            required
            maxLength={ALT_TEXT_MAX}
            defaultValue={values?.alt_text ?? image.altText}
            error={fe.alt_text}
          />
          <TextField
            idPrefix={prefix}
            label="Caption"
            name="label"
            maxLength={LABEL_MAX}
            defaultValue={values?.label ?? image.label ?? ""}
            error={fe.label}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Saving…" : "Save details"}
            </Button>
            <p aria-live="polite" className={cn("text-sm", state.status === "error" ? "text-danger" : "text-gold-strong")}>
              {state.status === "error" ? (state.message ?? "Please fix the highlighted fields.") : state.status === "success" ? state.message : ""}
            </p>
          </div>
        </form>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <form action={moveAction} className="flex gap-2">
            <input type="hidden" name="imageId" value={image.id} />
            <Button type="submit" name="direction" value="up" variant="ghost" disabled={moving || index === 0} className="px-4">
              <span aria-hidden="true">↑</span> Move earlier<span className="sr-only">: {name}</span>
            </Button>
            <Button type="submit" name="direction" value="down" variant="ghost" disabled={moving || index === count - 1} className="px-4">
              <span aria-hidden="true">↓</span> Move later<span className="sr-only">: {name}</span>
            </Button>
          </form>
          <div className="ml-auto">
            <ConfirmAction
              triggerLabel={<>Delete<span className="sr-only"> {name}</span></>}
              title="Delete this photo?"
              description={<p>The photo is removed from the gallery and its file is deleted from storage. This can&apos;t be undone.</p>}
              confirmLabel="Delete photo"
              pendingLabel="Deleting…"
              action={deletePropertyImage}
              fields={{ imageId: image.id }}
            />
          </div>
          {moveState.status === "error" && (
            <p role="alert" className="w-full text-sm text-danger">
              {moveState.message}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
