"use client";

import { useActionState } from "react";
import { AuthField, FieldFrame, FormAlert, describedBy } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { ButtonLink } from "@/components/ui/Button";
import { Select, fieldClass } from "@/components/ui/form";
import { MessageIcon } from "@/components/ui/icons";
import { sendContactRequest } from "@/lib/contact/actions";
import { cn } from "@/lib/utils/cn";
import { CONTACT_MESSAGE_MAX } from "@/lib/validations/contact";
import type { ContactFormState } from "@/types/contact";

const initialState: ContactFormState = { status: "idle" };
const MESSAGE_HINT = "Ask about the property, pricing, availability or anything else.";
const AGENT_HINT = "Leave as is for a general enquiry.";

type AgentOption = { id: string; fullName: string; agencyName: string };

/**
 * Contact-an-agent form, for signed-in users (the page requires login). Posts to the sendContactRequest
 * Server Action (works before hydration too); the button is disabled while sending and the form
 * is replaced by a confirmation on success, so an enquiry is not sent twice by accident.
 *
 * The recipient comes either from the page context (`agent`, sent as a hidden field) or, for a
 * general enquiry, from the optional agent picker (`agentOptions`).
 */
export function ContactForm({
  propertyId,
  agent,
  agentOptions,
  defaults,
}: {
  propertyId: string | null;
  agent: AgentOption | null;
  agentOptions: AgentOption[];
  defaults: { name: string; email: string };
}) {
  const [state, formAction, pending] = useActionState(sendContactRequest, initialState);
  const formRef = useFocusFirstError(state);

  if (state.status === "success") {
    return <ContactSuccess email={state.email} agentName={agent?.fullName} propertyId={propertyId} />;
  }

  const errors = state.status === "error" ? state : undefined;
  const values = errors?.values ?? { name: defaults.name, email: defaults.email };
  const fieldErrors = errors?.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <FormAlert message={errors?.message} />
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      {agent && <input type="hidden" name="agentId" value={agent.id} />}

      {/* Honeypot for bots: hidden from people and assistive technology, never filled by them. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {!agent && agentOptions.length > 0 && (
        <FieldFrame id="contact-agent" label="Agent (optional)" hint={AGENT_HINT}>
          <Select
            id="contact-agent"
            name="agentId"
            defaultValue={values.agentId ?? ""}
            aria-describedby={describedBy("contact-agent", undefined, AGENT_HINT)}
            className="bg-white text-base sm:text-sm"
          >
            <option value="">No preference</option>
            {agentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.fullName}
                {option.agencyName ? ` — ${option.agencyName}` : ""}
              </option>
            ))}
          </Select>
        </FieldFrame>
      )}

      <AuthField
        label="Full name"
        name="name"
        type="text"
        autoComplete="name"
        required
        maxLength={120}
        defaultValue={values.name}
        error={fieldErrors.name}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          defaultValue={values.email}
          error={fieldErrors.email}
        />
        <AuthField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={30}
          placeholder="0300 1234567"
          defaultValue={values.phone}
          error={fieldErrors.phone}
        />
      </div>

      <FieldFrame id="contact-message" label="Message" error={fieldErrors.message} hint={MESSAGE_HINT}>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={CONTACT_MESSAGE_MAX}
          defaultValue={values.message}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={describedBy("contact-message", fieldErrors.message, MESSAGE_HINT)}
          className={cn(
            fieldClass,
            "h-auto min-h-32 resize-y bg-white py-3 text-base sm:text-sm",
            fieldErrors.message && "border-danger",
          )}
        />
      </FieldFrame>

      <SubmitButton pending={pending} pendingLabel="Sending…">
        Send message
      </SubmitButton>
      <p className="text-center text-xs text-stone">
        Your details are only used to answer this enquiry.
      </p>
    </form>
  );
}

function ContactSuccess({
  email,
  agentName,
  propertyId,
}: {
  email: string;
  agentName?: string;
  propertyId: string | null;
}) {
  return (
    <div role="status" className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-sand text-gold-strong">
        <MessageIcon className="size-7" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">Message received</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        Your enquiry{agentName ? ` for ${agentName}` : ""} has been saved. Replies will come to{" "}
        <span className="font-medium break-all text-charcoal">{email}</span>.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {propertyId ? (
          <ButtonLink href={`/properties/${propertyId}`} variant="secondary">
            Back to property
          </ButtonLink>
        ) : (
          <ButtonLink href="/agents" variant="secondary">
            Meet our agents
          </ButtonLink>
        )}
        <ButtonLink href="/properties">Browse properties</ButtonLink>
      </div>
    </div>
  );
}
