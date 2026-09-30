import type { NextConfig } from "next";

// Listing photos are served from the project's public Supabase Storage bucket. next/image may only
// optimise remote images from exactly that bucket; any other remote URL is refused with a 400.
// (Next.js loads .env.local before reading this file.)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin photo uploads go through Server Actions. Photos themselves are capped at 5 MB (the
      // property-images bucket limit, enforced by validateImageFile in every upload action). The
      // request limit is set well above that so an oversized photo still reaches the action and
      // gets a clear "larger than 5 MB" form error instead of Next.js rejecting the whole request.
      // The admin forms also check the size before sending. (Default: 1 MB.)
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/property-images/**`)]
      : [],
  },
};

export default nextConfig;
