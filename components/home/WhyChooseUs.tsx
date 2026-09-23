import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/ui/Container";
import {
  CalendarCheckIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

const BENEFITS: {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    title: "Easy Search",
    description:
      "Filter by city, property type, price and bedrooms to find the right place in minutes.",
    icon: SearchIcon,
  },
  {
    title: "Verified Listings",
    description: "Listings are reviewed before they go live, so what you see is what you get.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Trusted Agents",
    description: "Work with experienced local agents who know their neighborhoods and respond promptly.",
    icon: UserCheckIcon,
  },
  {
    title: "Easy Booking",
    description: "Request a viewing in a few clicks and pick the date and time that suit you.",
    icon: CalendarCheckIcon,
  },
];

export function WhyChooseUs() {
  return (
    <section aria-labelledby="why-heading" className="py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-20">
        <SectionHeading
          eyebrow="Why choose EstateHub"
          title={<span id="why-heading">A calmer way to find your next home</span>}
          description="We keep the process simple and transparent, from the first search to the day you get the keys."
        />

        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {BENEFITS.map(({ title, description, icon: Icon }) => (
            <li key={title} className="border-t border-line pt-6">
              <span className="grid size-12 place-items-center rounded-full bg-sand text-gold-strong">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-stone">{description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
