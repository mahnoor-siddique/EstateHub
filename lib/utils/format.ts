import type { ListingType } from "@/types/property";

function trim(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Formats a PKR amount the way Pakistani listings usually read it:
 * 18,50,00,000 -> "PKR 18.5 Crore", 6,500,000 -> "PKR 65 Lakh".
 * Rentals get a "/ month" suffix.
 */
export function formatPrice(amount: number, listing: ListingType): string {
  let text: string;
  if (amount >= 10_000_000) text = `${trim(amount / 10_000_000)} Crore`;
  else if (amount >= 100_000 && listing === "For Sale") text = `${trim(amount / 100_000)} Lakh`;
  else text = amount.toLocaleString("en-US");
  return listing === "For Rent" ? `PKR ${text} / month` : `PKR ${text}`;
}

/** "2026-10-03" -> "Saturday, 3 October 2026". Parsed as UTC so the day never shifts. */
export function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "14:30" -> "2:30 PM". */
export function formatBookingTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
