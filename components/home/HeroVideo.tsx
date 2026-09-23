"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const VIDEO_SRC = "/videos/hero-real-estate.mp4";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const noopSubscribe = () => () => {};

/**
 * The cinematic background video, plus its pause/play control.
 *
 * - The server always renders only the static backdrop (in Hero), so first paint never waits
 *   for the video and users with reduced motion never download it.
 * - After hydration, the <video> is mounted only when the user has NOT asked for reduced motion.
 *   Reduced-motion users can still opt in with the play button.
 * - The video fades in over the backdrop once a frame is ready. If it errors, the backdrop stays.
 * - The video is decorative (aria-hidden); no information is conveyed only through it.
 */
export function HeroVideo() {
  // Server + hydration snapshot is `true` (reduced) so nothing autoplays before we know.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [optedIn, setOptedIn] = useState(false); // reduced-motion user pressed play
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const mounted = hydrated && !failed && (!reducedMotion || optedIn);

  function toggle() {
    const video = videoRef.current;
    if (!video) {
      setOptedIn(true); // mounting the video autoplays it
      return;
    }
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }

  return (
    <>
      {mounted && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={() => setReady(true)}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 -z-10 size-full object-cover transition-opacity duration-1000",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {hydrated && !failed && (
        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 bottom-[4.75rem] z-10 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-navy/60 px-4 text-xs font-medium text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-navy/80 sm:right-6 sm:bottom-32 lg:right-8"
        >
          {playing ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
          {playing ? "Pause background video" : "Play background video"}
        </button>
      )}
    </>
  );
}
