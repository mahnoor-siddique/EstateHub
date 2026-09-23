"use client";

import { Select } from "@/components/ui/form";
import { SORT_OPTIONS, type SortOption } from "@/lib/utils/property-filters";

/**
 * Sort order control. It belongs to the filter form through the `form` attribute, so the current
 * filters are kept, and it re-submits that form as soon as the choice changes.
 */
export function SortSelect({ formId, value }: { formId: string; value: SortOption }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="shrink-0 text-sm font-medium text-stone">
        Sort by
      </label>
      <div className="w-52">
        <Select
          id="sort"
          name="sort"
          form={formId}
          defaultValue={value}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
