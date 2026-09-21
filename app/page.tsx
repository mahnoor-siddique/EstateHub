import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

/**
 * Phase 1 placeholder. The real homepage (cinematic hero, search, statistics,
 * featured properties, ...) is Phase 2 and will replace this file's contents.
 */
export default function Home() {
  return (
    <Container className="py-24 sm:py-32">
      <SectionHeading
        as="h1"
        eyebrow="Foundation ready"
        title={`Welcome to ${SITE.name}`}
        description="The layout, theme, navigation and footer are in place. The homepage sections arrive in the next phase."
      />
    </Container>
  );
}
