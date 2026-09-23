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
