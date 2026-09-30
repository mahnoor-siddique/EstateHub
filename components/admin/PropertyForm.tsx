"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth/AuthFields";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import type { AdminFormState, AgentOption } from "@/lib/admin/types";
import { CITIES } from "@/lib/site";
import {
  AMENITY_FIELDS,
  AREA_UNITS,
  DESCRIPTION_MAX,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  type PropertyField,
} from "@/lib/validations/admin-property";
import { LISTING_TYPES, PROPERTY_TYPES } from "@/types/property";

type State = AdminFormState<PropertyField>;
type Action = (state: State, formData: FormData) => Promise<State>;

const initialState: State = { status: "idle" };

/** Values for a new property: sensible defaults, everything else empty. */
export const NEW_PROPERTY_VALUES: Record<string, string> = {
  status: "available",
  area_unit: "Marla",
  bedrooms: "0",
  bathrooms: "0",
  parking_spaces: "0",
};

/**
 * Add/edit form for a property, posting to a Server Action (which validates everything again).
 * After a failed submit the entered values are kept and focus moves to the first invalid field.
 */
export function PropertyForm({
  action,
  initialValues,
  agents,
  submitLabel,
  pendingLabel,
}: {
  action: Action;
  initialValues: Record<string, string>;
  agents: AgentOption[];
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useFocusFirstError(state);

  const errors = state.status === "error" ? state : undefined;
  const values = errors?.values ?? initialValues;
  const fe = errors?.fieldErrors ?? {};
  // Re-mount the fields when a failed submit returns values, so they show what was entered.
  const key = errors ? JSON.stringify(values) : "initial";

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-8">
      <FormAlert message={errors?.message ?? (errors ? "Please fix the highlighted fields." : undefined)} />
      {state.status === "success" && <FormAlert tone="success" message={state.message} />}

      <fieldset key={`basics-${key}`} className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl text-navy">Listing</legend>
        <div className="sm:col-span-2">
          <TextField label="Title" name="title" required maxLength={160} defaultValue={values.title} error={fe.title} />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Description"
            name="description"
            maxLength={DESCRIPTION_MAX}
            rows={6}
            defaultValue={values.description}
            error={fe.description}
            hint="Optional. Shown on the property page."
          />
        </div>
        <SelectField label="Property type" name="property_type" required defaultValue={values.property_type ?? ""} error={fe.property_type}>
          <option value="" disabled>Choose a type</option>
          {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </SelectField>
        <SelectField label="Listing type" name="listing_type" required defaultValue={values.listing_type ?? ""} error={fe.listing_type}>
          <option value="" disabled>For sale or rent?</option>
          {LISTING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </SelectField>
        <TextField
          label="Price (PKR)"
          name="price"
          required
          inputMode="numeric"
          autoComplete="off"
          defaultValue={values.price}
          error={fe.price}
          hint="Whole rupees. For rentals, the monthly rent."
        />
        <SelectField label="Status" name="status" required defaultValue={values.status ?? "available"} error={fe.status}>
          {PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_STATUS_LABELS[status]}</option>)}
        </SelectField>
        <div className="sm:col-span-2">
          <SelectField
            label="Agent"
            name="agent_id"
            required
            defaultValue={values.agent_id ?? ""}
            error={fe.agent_id}
            hint="The agent who handles enquiries and viewings for this property."
          >
            <option value="" disabled>Choose an agent</option>
            {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}
          </SelectField>
        </div>
      </fieldset>

      <fieldset key={`location-${key}`} className="grid gap-5 border-t border-line pt-8 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl text-navy">Location</legend>
        <SelectField label="City" name="city" required defaultValue={values.city ?? ""} error={fe.city}>
          <option value="" disabled>Choose a city</option>
          {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
        </SelectField>
        <TextField label="Area / society" name="area_location" required maxLength={120} defaultValue={values.area_location} error={fe.area_location} hint="e.g. DHA Phase 6" />
        <div className="sm:col-span-2">
          <TextField label="Address" name="address" maxLength={255} defaultValue={values.address} error={fe.address} hint="Optional." />
        </div>
      </fieldset>

      <fieldset key={`size-${key}`} className="grid gap-5 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-4 font-serif text-xl text-navy">Size and features</legend>
        <TextField label="Size" name="area" required inputMode="decimal" autoComplete="off" defaultValue={values.area} error={fe.area} />
        <SelectField label="Size unit" name="area_unit" required defaultValue={values.area_unit ?? "Marla"} error={fe.area_unit}>
          {AREA_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
        </SelectField>
        <TextField label="Year built" name="year_built" inputMode="numeric" autoComplete="off" defaultValue={values.year_built} error={fe.year_built} hint="Optional." />
        <TextField label="Bedrooms" name="bedrooms" inputMode="numeric" autoComplete="off" defaultValue={values.bedrooms} error={fe.bedrooms} />
        <TextField label="Bathrooms" name="bathrooms" inputMode="numeric" autoComplete="off" defaultValue={values.bathrooms} error={fe.bathrooms} />
        <TextField label="Parking spaces" name="parking_spaces" inputMode="numeric" autoComplete="off" defaultValue={values.parking_spaces} error={fe.parking_spaces} />
      </fieldset>

      <fieldset key={`amenities-${key}`} className="border-t border-line pt-8">
        <legend className="mb-4 font-serif text-xl text-navy">Amenities</legend>
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {AMENITY_FIELDS.map(({ name, label }) => (
            <CheckboxField key={name} name={name} label={label} defaultChecked={values[name] === "on"} />
          ))}
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
