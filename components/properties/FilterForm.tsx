"use client";

import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import { DEFAULT_SORT } from "@/lib/utils/property-filters";

/**
 * GET form for /properties. Without JavaScript it submits natively (the URL still carries every
 * filter). With JavaScript it drops empty fields and the default sort so the URL stays clean (?city=Lahore rather than
 * ?city=Lahore&propertyType=&...), then navigates client-side without jumping back to the top.
 */
export function FilterForm({ children, ...props }: Omit<ComponentPropsWithoutRef<"form">, "action" | "method" | "onSubmit">) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value !== "string" || value.trim() === "") continue;
      if (key === "sort" && value === DEFAULT_SORT) continue; // the default needs no param
      params.append(key, value.trim());
    }
    const query = params.toString();
    router.push(query ? `/properties?${query}` : "/properties", { scroll: false });
  }

  return (
    <form action="/properties" method="get" onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
}
