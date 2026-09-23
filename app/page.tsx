import { CTA } from "@/components/home/CTA";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { Hero } from "@/components/home/Hero";
import { PopularCities } from "@/components/home/PopularCities";
import { PropertySearch } from "@/components/home/PropertySearch";
import { Stats } from "@/components/home/Stats";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

export default function Home() {
  return (
    <>
      <Hero />
      <PropertySearch />
      <Stats />
      <FeaturedProperties />
      <PopularCities />
      <WhyChooseUs />
      <CTA />
    </>
  );
}
