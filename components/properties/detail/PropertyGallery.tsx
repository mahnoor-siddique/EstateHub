"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { PropertyPhoto } from "@/types/property";

const navButtonClass =
  "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-navy shadow-card transition-colors hover:bg-white active:bg-sand";

/**
 * Photo gallery for the details page: a large main image with previous/next controls and a row of
 * thumbnails underneath. The thumbnail for the photo on screen is highlighted. Left/right arrow keys
 * also work while focus is inside the gallery, and each change is announced to screen readers.
 */
export function PropertyGallery({ images, title }: { images: PropertyPhoto[]; title: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const active = images[index];

  const show = (next: number) => setIndex((next + count) % count); // wraps around at both ends

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
  }

  return (
    <section aria-label={`Photos of ${title}`} onKeyDown={handleKeyDown}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand shadow-card sm:aspect-[16/9]">
        {/* key: remount per photo so it fades in (starting: = CSS @starting-style) */}
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt}
          fill
          preload={index === 0}
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-cover transition-opacity duration-300 starting:opacity-0"
        />

        <button
          type="button"
          onClick={() => show(index - 1)}
          aria-label="Previous photo"
          className={cn(navButtonClass, "left-3 sm:left-4")}
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => show(index + 1)}
          aria-label="Next photo"
          className={cn(navButtonClass, "right-3 sm:right-4")}
        >
          <ArrowRightIcon className="size-5" />
        </button>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-4"
        >
          <span className="rounded-full bg-navy/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {active.label}
          </span>
          <span className="rounded-full bg-navy/80 px-3 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
            {index + 1} / {count}
          </span>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Photo {index + 1} of {count}: {active.label}
      </p>

      {/* One column per photo so the thumbnails always fit on a single row. */}
      <ul
        className="mt-3 grid gap-2 sm:mt-4 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {images.map((photo, i) => {
          const current = i === index;
          return (
            <li key={photo.src}>
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={`Show photo ${i + 1} of ${count}: ${photo.label}`}
                aria-current={current ? "true" : undefined}
                className="group block w-full cursor-pointer text-left"
              >
                <span
                  className={cn(
                    "relative block aspect-[4/3] overflow-hidden rounded-lg bg-sand transition-[opacity,box-shadow] duration-200",
                    current
                      ? "ring-2 ring-gold-strong ring-offset-2 ring-offset-ivory"
                      : "opacity-65 group-hover:opacity-100",
                  )}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 240px, 20vw"
                    className="object-cover"
                  />
                </span>
                <span
                  className={cn(
                    "mt-2 hidden truncate text-xs md:block",
                    current ? "font-semibold text-navy" : "text-stone",
                  )}
                >
                  {photo.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
