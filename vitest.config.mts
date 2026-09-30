import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
 * Vitest runs the auth tests in plain Node (no browser/DOM needed). `@/` mirrors the tsconfig path
 * alias. Like Next.js, it loads .env.local (public Supabase URL + publishable key) and the optional,
 * gitignored .env.test.local (AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD for the integration tests).
 * Variables already set in the shell win. No secret or service-role key is involved.
 */
for (const file of [".env.test.local", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // Next.js resolves "server-only" itself at build time; tests run on the server anyway.
      "server-only": fileURLToPath(new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
