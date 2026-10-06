import type { NextConfig } from "next";

// Photos uploaded from /admin are served from the AWS S3 image bucket; older ones are still served
// from the project's public Supabase Storage bucket. next/image may only optimise remote images
// from exactly those two buckets; any other remote URL is refused with a 400.
// (Next.js loads .env.local before reading this file. Both values are fixed at build time.)
const s3Bucket = process.env.AWS_S3_BUCKET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Admin photo uploads go through Server Actions. Photos themselves are capped at 5 MB
      // (enforced by validateImageFile in every upload action). The
      // request limit is set well above that so an oversized photo still reaches the action and
      // gets a clear "larger than 5 MB" form error instead of Next.js rejecting the whole request.
      // The admin forms also check the size before sending. (Default: 1 MB.)
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/property-images/**`)] : []),
      ...(s3Bucket ? [new URL(`https://${s3Bucket}.s3.eu-north-1.amazonaws.com/**`)] : []),
    ],
  },
};

export default nextConfig;
