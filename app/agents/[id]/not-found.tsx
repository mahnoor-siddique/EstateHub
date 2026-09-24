import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, UserCheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Agent not found",
};

/** Shown when /agents/[id] is visited with an id that doesn't match any agent. */
export default function AgentNotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
          <UserCheckIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
          Agent not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">
          We couldn&apos;t find this agent
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone sm:text-lg">
          The link may be mistyped, or the agent may no longer be listed. Meet the rest of our team to
          find the right person to help.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/agents">
            <ArrowLeftIcon className="size-4" />
            Browse agents
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
