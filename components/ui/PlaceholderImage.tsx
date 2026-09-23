import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export type Scene = "villa" | "house" | "apartment" | "commercial" | "skyline";
export type Tone = "dusk" | "sand" | "slate";

/** [sky top, sky bottom, ground, building body, building shade]. */
const TONES: Record<Tone, [string, string, string, string, string]> = {
  dusk: ["#0b1b2e", "#2b4560", "#0a1727", "#e7dfd0", "#c9bea9"],
  sand: ["#e9dcc4", "#f6efe0", "#c9b58f", "#ffffff", "#e2d6bf"],
  slate: ["#1f2933", "#4a5866", "#161d24", "#dcd6ca", "#b8b1a3"],
};

const WARM = "#f3cf8a"; // lit windows

type Props = {
  scene: Scene;
  tone?: Tone;
  /** Real image, when one exists. The designed placeholder is used until then. */
  src?: string;
  alt?: string;
  sizes?: string;
  className?: string;
};

/** A softly lit window. */
function Win({ x, y, w = 14, h = 20 }: { x: number; y: number; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx="1.5" fill={WARM} opacity="0.92" />;
}

function Buildings({ scene, body, shade }: { scene: Scene; body: string; shade: string }) {
  switch (scene) {
    case "villa":
      return (
        <>
          <rect x="70" y="150" width="150" height="90" fill={body} />
          <rect x="200" y="112" width="130" height="128" fill={shade} />
          <rect x="60" y="142" width="176" height="9" fill={shade} />
          <rect x="192" y="104" width="146" height="9" fill={body} />
          <Win x={90} y={172} w={22} h={30} />
          <Win x={126} y={172} w={22} h={30} />
          <Win x={162} y={172} w={22} h={30} />
          <Win x={222} y={136} w={30} h={34} />
          <Win x={266} y={136} w={30} h={34} />
          <Win x={222} y={188} w={16} h={30} />
          <Win x={252} y={188} w={16} h={30} />
        </>
      );
    case "house":
      return (
        <>
          <rect x="95" y="140" width="210" height="100" fill={body} />
          <path d="M80 142 L200 92 L320 142 Z" fill={shade} />
          <rect x="182" y="184" width="36" height="56" fill={shade} />
          <Win x={115} y={165} w={26} h={30} />
          <Win x={154} y={165} w={16} h={30} />
          <Win x={230} y={165} w={16} h={30} />
          <Win x={262} y={165} w={26} h={30} />
          <Win x={190} y={112} w={20} h={18} />
        </>
      );
    case "apartment":
      return (
        <>
          <rect x="120" y="60" width="160" height="180" fill={body} />
          <rect x="100" y="98" width="24" height="142" fill={shade} />
          <rect x="276" y="120" width="24" height="120" fill={shade} />
          {[80, 116, 152, 188].map((y) => (
            <g key={y}>
              <Win x={138} y={y} w={22} h={22} />
              <Win x={170} y={y} w={22} h={22} />
              <Win x={202} y={y} w={22} h={22} />
              <Win x={234} y={y} w={22} h={22} />
            </g>
          ))}
        </>
      );
    case "commercial":
      return (
        <>
          <rect x="110" y="70" width="180" height="170" fill={body} />
          <rect x="110" y="70" width="180" height="12" fill={shade} />
          {[92, 124, 156, 188].map((y) => (
            <rect key={y} x="124" y={y} width="152" height="18" fill={WARM} opacity="0.85" />
          ))}
          <rect x="176" y="214" width="48" height="26" fill={shade} />
        </>
      );
    case "skyline":
      return (
        <>
          <rect x="30" y="150" width="46" height="90" fill={shade} />
          <rect x="84" y="108" width="52" height="132" fill={body} />
          <rect x="144" y="70" width="60" height="170" fill={shade} />
          <rect x="212" y="126" width="46" height="114" fill={body} />
          <rect x="266" y="96" width="54" height="144" fill={shade} />
          <rect x="328" y="146" width="44" height="94" fill={body} />
          <rect x="172" y="52" width="4" height="18" fill={shade} />
          {[84, 112, 140, 168].map((y) => (
            <g key={y}>
              <Win x={96} y={y + 30} w={8} h={12} />
              <Win x={112} y={y + 30} w={8} h={12} />
              <Win x={158} y={y - 4} w={8} h={12} />
              <Win x={180} y={y - 4} w={8} h={12} />
              <Win x={278} y={y + 10} w={8} h={12} />
              <Win x={296} y={y + 10} w={8} h={12} />
            </g>
          ))}
        </>
      );
  }
}

/**
 * Image slot used until real property/city photography exists.
 * - With `src` it renders an optimised next/image, so swapping in real photos later is a data change.
 * - Without `src` it draws a calm, on-brand architectural scene (navy dusk, warm-lit windows).
 * The parent decides the aspect ratio and must be `relative`; this fills it.
 */
export function PlaceholderImage({ scene, tone = "dusk", src, alt = "", sizes, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [top, bottom, ground, body, shade] = TONES[tone];

  if (src) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", className)} />
    );
  }

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn("absolute inset-0 size-full", className)}
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#sky-${uid})`} />
      <circle cx="330" cy="58" r="22" fill={WARM} opacity={tone === "sand" ? 0.45 : 0.16} />
      <Buildings scene={scene} body={body} shade={shade} />
      <rect y="240" width="400" height="60" fill={ground} />
      <rect y="240" width="400" height="2" fill={WARM} opacity="0.35" />
    </svg>
  );
}
