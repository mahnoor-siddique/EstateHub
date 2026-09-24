import type { StaticImageData } from "next/image";
import ayeshaRehman from "@/public/images/agents/ayesha-rehman.png";
import hamzaQureshi from "@/public/images/agents/hamza-qureshi.png";
import saraMalik from "@/public/images/agents/sara-malik.png";

/*
 * Wide banner portraits for the /agents directory cards, keyed by agent id. These are
 * AI-generated images of the fictional demo agents, not real people. Phase 9 moves agent media
 * to storage, at which point this map becomes a field on the agent record.
 */
export type AgentBannerPhoto = { src: StaticImageData; alt: string };

export const AGENT_BANNER_PHOTOS: Record<string, AgentBannerPhoto> = {
  "demo-agent-sara": {
    src: saraMalik,
    alt: "Sara Malik smiling in a black blazer on a terrace overlooking the city",
  },
  "demo-agent-hamza": {
    src: hamzaQureshi,
    alt: "Hamza Qureshi in a navy blazer, seated in a high-rise lounge with a city skyline behind him",
  },
  "demo-agent-ayesha": {
    src: ayeshaRehman,
    alt: "Ayesha Rehman smiling in a beige blazer at her desk beside windows with a city view",
  },
};
