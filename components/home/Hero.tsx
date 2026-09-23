import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { HeroVideo } from "./HeroVideo";

/**
 * Cinematic hero. Layers, back to front:
 *  1. navy base + static villa scene: the poster/fallback (also what reduced-motion users see)
 *  2. <video> from HeroVideo, fading in over the backdrop
 *  3. dark scrim so the copy stays readable over any frame
 *  4. the hero copy
 * The bottom padding leaves room for the search panel, which overlaps the hero's lower edge.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="on-dark relative isolate flex min-h-[36rem] items-center overflow-hidden bg-navy text-white sm:min-h-[42rem] lg:min-h-[calc(100svh-5rem)] lg:max-h-[52rem]"
    >
      {/* 1. static backdrop / poster */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-navy">
        <div className="absolute right-0 bottom-0 aspect-[4/3] w-[130%] opacity-55 [mask-image:linear-gradient(to_right,transparent_0%,#000_45%)] sm:w-[80%] lg:w-[62%]">
          <PlaceholderImage scene="villa" tone="dusk" />
        </div>
      </div>

      {/* 2. video (client) */}
      <HeroVideo />

      {/* 3. scrim: a flat tint plus a left-weighted fade behind the copy */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[5] bg-navy/20 bg-gradient-to-r from-navy/55 via-navy/15 to-transparent"
      />

      {/* 4. copy */}
      <Container className="pt-16 pb-36 sm:pb-36 lg:pt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm">
            Modern living. Brighter tomorrows.
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-[2.5rem] leading-[1.08] font-semibold text-white sm:text-6xl lg:text-7xl"
          >
            Discover space you truly belong in
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Explore verified properties for sale and rent across your favorite cities.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/properties" size="lg">
              Explore Properties
              <ArrowRightIcon className="size-5" />
            </ButtonLink>
            <ButtonLink href="/agents" variant="onDark" size="lg">
              Meet our agents
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
