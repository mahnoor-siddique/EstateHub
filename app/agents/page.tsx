import type { Metadata } from "next";
import Image from "next/image";
import { AgentCard } from "@/components/agents/AgentCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAgents } from "@/lib/queries/agents";
import heroImage from "@/public/images/agents/agents-hero.png";

export const metadata: Metadata = {
  title: "Agents",
  description:
    "Meet EstateHub's property agents across Lahore, Islamabad, Karachi, Rawalpindi and Faisalabad, and find the right person to guide your next move.",
};

export default async function AgentsPage() {
  const agents = await getAgents();
  const count = agents.length;

  return (
    <>
      {/*
       * The photo (agents meeting over floor plans, seen from above) has a plain warm area on its left.
       * On desktop it fills the header behind the copy, anchored right, with a sand fade under the text.
       * Below lg the copy would cover the people, so the photo sits as a band beneath the text instead.
       */}
      <header className="relative isolate overflow-hidden border-b border-line bg-sand">
        <Container className="py-14 sm:py-20 lg:flex lg:min-h-[30rem] lg:items-center lg:py-24">
          <SectionHeading
            as="h1"
            eyebrow="Our agents"
            title="Guidance from people who know the market"
            description="Our agents help you buy, sell and rent across Pakistan's major cities, from the first viewing to the final paperwork."
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
            className="object-cover object-[80%_50%] lg:object-right"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-sand via-sand/70 via-40% to-transparent to-65% lg:block"
        />
      </header>

      <Container className="py-10 sm:py-12 lg:py-16">
        <section aria-labelledby="agents-heading">
          <div className="mb-6">
            <h2 id="agents-heading" className="font-sans text-lg font-semibold text-charcoal">
              {count} {count === 1 ? "agent" : "agents"}
            </h2>
          </div>

          {/* 1 column on phones, 2 on tablets, 3 on desktop — same breakpoints as the property grid. */}
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {agents.map((agent) => (
              <li key={agent.id} className="flex">
                <AgentCard agent={agent} />
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
