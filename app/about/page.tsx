import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { CTA } from "@/components/home/CTA";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  HomeIcon,
  MessageIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAgents } from "@/lib/queries/supabase/agents";
import { CITIES, SITE } from "@/lib/site";
import type { AgentSummary } from "@/types/agent";
import heroImage from "@/public/images/properties-hero.jpg";

export const metadata: Metadata = {
  title: "About",
  description:
    "What EstateHub is and how it works: search properties for sale and rent across Pakistan's major cities, meet local agents, and book viewings or send enquiries from one account.",
};

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/*
 * Everything on this page describes what the site actually does today. There are no statistics,
 * reviews or awards here on purpose: nothing in the project supports them. Agent details come live
 * from Supabase, the same query as /agents.
 */

const OFFERS = [
  "Search for houses, apartments, villas and commercial property to buy or rent",
  "Search and filter listings, and sort them by price or date",
  "See every listing's photos, price, key facts and amenities",
  "Meet the agent behind each listing",
  "Request a viewing or send the agent an enquiry",
  "Keep track of your viewing requests in My bookings",
];

const SEARCH_FEATURES = [
  { title: "Filters that match how you search", text: "City, property type, sale or rent, price range in PKR, bedrooms, bathrooms and amenities such as parking, a garden or backup power." },
  { title: "Sorted your way", text: "Newest listings first, or by price from low to high or high to low." },
  { title: "Searches you can share", text: "Your filters live in the page address, so a search can be bookmarked or sent to someone else." },
];

const LISTING_DETAILS = ["Full photo gallery", "Price and sale or rent", "Bedrooms, bathrooms and area", "Year built and parking", "Amenities", "The listing's agent"];

const STEPS: { icon: Icon; title: string; text: ReactNode }[] = [
  {
    icon: UserCheckIcon,
    title: "Sign in or create an account",
    text: "Booking a viewing and contacting an agent both need a free account. If you start either one while signed out, we take you to log in and bring you straight back to it afterwards.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Book a viewing or contact the agent",
    text: "Pick a date and time for a viewing, or send a message with your question. Enquiries about a listing go to that listing's own agent.",
  },
  {
    icon: HomeIcon,
    title: "Follow your viewing requests",
    text: "Each request stays Pending until the agent confirms it. You can see all of yours, upcoming and past, in My bookings.",
  },
];

const PROMISES: { icon: Icon; title: string; text: string }[] = [
  { icon: HomeIcon, title: "Clear listings", text: "Every listing shows its price in PKR, whether it is for sale or rent, its key facts and its photos." },
  { icon: MessageIcon, title: "The right agent", text: "An enquiry about a property reaches the agent who handles that property, not a general inbox." },
  { icon: ShieldCheckIcon, title: "Your details stay yours", text: "Your viewing requests and enquiries are only visible to your own account, and your details are only used to answer them." },
  { icon: CalendarCheckIcon, title: "Honest status", text: "A viewing request is shown as Pending until the agent confirms it, so you always know where it stands." },
];

/** Live agents for the "Our agents" section. [] if Supabase fails, so the rest of the page still loads. */
async function loadAgents(): Promise<AgentSummary[]> {
  try {
    return await getAgents();
  } catch (error) {
    console.error("About page agents unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sand text-gold-strong">
            <CheckIcon className="size-3.5" strokeWidth={2.5} />
          </span>
          <span className="leading-relaxed text-charcoal">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AboutPage() {
  // Agents come from Supabase, so render on each request instead of freezing a build-time snapshot.
  await connection();
  const agents = await loadAgents();

  return (
    <>
      {/* Same header layout as /agents: photo behind the copy from lg, a band beneath it below lg. */}
      <header className="relative isolate overflow-hidden border-b border-line bg-sand">
        <Container className="py-14 sm:py-20 lg:flex lg:min-h-[30rem] lg:items-center lg:py-24">
          <SectionHeading
            as="h1"
            eyebrow={`About ${SITE.name}`}
            title="A simpler way to find your place"
            description={`${SITE.name} brings property listings, local agents and viewing requests together in one place, so you can go from searching to standing in a home you like with less back and forth.`}
            className="lg:max-w-xl"
          />
        </Container>
        <div className="relative aspect-[16/10] sm:aspect-[5/2] lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
          <Image
            src={heroImage}
            alt=""
            fill
            preload
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[60%_40%] lg:object-right"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-sand via-sand/80 via-45% to-transparent to-70% lg:block"
        />
      </header>

      {/* What EstateHub is */}
      <section aria-labelledby="what-heading" className="py-16 sm:py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="What we are"
              title={<span id="what-heading">A property portal built around the viewing</span>}
            />
            <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-stone sm:text-lg">
              <p>
                {SITE.name} is an online property portal for Pakistan, for homes and commercial
                spaces to buy or rent. Search covers {CITIES.slice(0, -1).join(", ")} and{" "}
                {CITIES[CITIES.length - 1]}, and every listing is handled by a named local agent.
              </p>
              <p>
                The aim is simple: help you find a place worth seeing, then make it easy to see it.
                Search, compare, and when something feels right, book a viewing with the agent who
                knows it.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
            <h3 className="font-sans text-xs font-semibold tracking-[0.18em] text-gold-strong uppercase">
              What you can do on {SITE.name}
            </h3>
            <CheckList items={OFFERS} className="mt-6 space-y-4" />
          </div>
        </Container>
      </section>

      {/* The search experience */}
      <section aria-labelledby="search-heading" className="bg-sand py-16 sm:py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Searching"
            title={<span id="search-heading">Find the right listings quickly</span>}
            description="Start from the homepage search or the Properties page and narrow things down until only the homes that fit are left."
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <ul className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
              {SEARCH_FEATURES.map(({ title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-gold-strong shadow-card">
                    <SearchIcon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-2 leading-relaxed text-stone">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="self-start rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
              <h3 className="text-2xl font-semibold">Every property page shows</h3>
              <CheckList items={LISTING_DETAILS} className="mt-6 grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-1" />
              <ButtonLink href="/properties" className="mt-8 w-full sm:w-auto">
                Browse properties
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Agents: live from Supabase. Left out if they cannot be loaded. */}
      {agents.length > 0 && (
        <section aria-labelledby="agents-heading" className="py-16 sm:py-20 lg:py-28">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Our agents"
                title={<span id="agents-heading">Local agents behind every listing</span>}
                description="Each listing is handled by one agent, who answers enquiries and arranges viewings for it. You can see every agent's listings on their profile."
              />
              <ButtonLink href="/agents" variant="secondary" className="self-start sm:self-auto">
                Meet all agents
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            </div>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {agents.map((agent) => (
                <li key={agent.id} className="flex">
                  <AgentCard agent={agent} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Booking and contact */}
      <section
        aria-labelledby="booking-heading"
        className={agents.length > 0 ? "bg-sand py-16 sm:py-20 lg:py-28" : "py-16 sm:py-20 lg:py-28"}
      >
        <Container>
          <SectionHeading
            eyebrow="Viewings and enquiries"
            title={<span id="booking-heading">From listing to viewing</span>}
            description="Found somewhere you like? Every property page has Book a Viewing and Contact Agent right beside the listing's agent."
          />

          <ol className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {STEPS.map(({ icon: StepIcon, title, text }, index) => (
              <li key={title} className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy text-gold">
                    <StepIcon className="size-5" />
                  </span>
                  <span className="font-serif text-3xl font-semibold text-line" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-stone">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Trust / value */}
      <section aria-labelledby="promises-heading" className="py-16 sm:py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-20">
          <SectionHeading
            eyebrow={`Why ${SITE.name}`}
            title={<span id="promises-heading">What you can count on</span>}
            description="A few things the site is built to do every time, from the first search to the viewing."
          />
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PROMISES.map(({ icon: PromiseIcon, title, text }) => (
              <li key={title} className="border-t border-line pt-6">
                <span className="grid size-12 place-items-center rounded-full bg-sand text-gold-strong">
                  <PromiseIcon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-stone">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CTA />
    </>
  );
}
