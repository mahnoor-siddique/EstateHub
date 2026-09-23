import Image from "next/image";
import { Container } from "@/components/ui/Container";
import heroImage from "@/public/images/properties-hero.jpg";

/**
 * Image banner at the top of /properties.
 * The photo is a still from the homepage hero video (modern villa, city skyline at sunset), stored
 * locally. A light navy tint plus a left-weighted fade keeps the white copy readable while the image
 * stays clearly visible. The sky on the left of the frame sits behind the copy.
 */
export function PropertiesHero() {
  return (
    <header className="on-dark relative isolate overflow-hidden bg-navy text-white">
      <Image
        src={heroImage}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="-z-20 object-cover object-[60%_40%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-navy/15 bg-gradient-to-r from-navy/60 via-navy/15 to-transparent"
      />

      <Container className="flex min-h-[20rem] items-center py-16 sm:min-h-[24rem] sm:py-20 lg:min-h-[26rem]">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-gold uppercase">Properties</p>
          <h1 className="text-3xl font-semibold text-balance text-white sm:text-4xl lg:text-5xl">
            Find a place that fits your life
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
            Explore houses, apartments, villas and commercial spaces for sale and rent across
            Pakistan&apos;s major cities.
          </p>
        </div>
      </Container>
    </header>
  );
}
