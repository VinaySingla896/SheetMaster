import { defineConfig } from "drizzle-kit";

// Database configuration removed
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
});
