import type { NextConfig } from "next";

// Listing photos are served from the project's public Supabase Storage bucket. next/image may only
// optimise remote images from exactly that bucket; any other remote URL is refused with a 400.
// (Next.js loads .env.local before reading this file.)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/property-images/**`)]
      : [],
  },
};

export default nextConfig;
