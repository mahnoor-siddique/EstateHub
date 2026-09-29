import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import islamabad from "@/public/images/cities/islamabad.jpg";

/**
 * Final call to action, an inset navy panel just above the (also navy) footer. The Islamabad sunset
 * fades in from the right behind the copy; it is decorative.
 */
export function CTA() {
  return (
    <section aria-labelledby="cta-heading" className="pb-20 lg:pb-28">
      <Container>
        <div className="on-dark relative isolate overflow-hidden rounded-2xl bg-navy px-6 py-14 text-white sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 -z-10 w-full opacity-40 [mask-image:linear-gradient(to_right,transparent_0%,#000_100%)] sm:w-3/5 sm:opacity-60"
          >
            <Image
              src={islamabad}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 640px) 60vw, 100vw"
              className="object-cover object-[70%_70%]"
            />
          </div>

          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">
              Let&apos;s find your perfect property
            </p>
            <h2 id="cta-heading" className="mt-4 text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
              Find a place that feels like yours.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
              Browse homes, apartments and villas across Pakistan&apos;s leading cities, and book a
              viewing when you find one you love.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/properties" size="lg">
                Explore Properties
                <ArrowRightIcon className="size-5" />
              </ButtonLink>
              <ButtonLink href="/signup" variant="onDark" size="lg">
                Get Started
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
