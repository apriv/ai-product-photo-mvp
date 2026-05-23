import "dotenv/config";
import { config as loadDotenv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js conventionally loads .env.local for app code, but the prisma CLI
// only reads .env by default. Explicitly load .env.local so `prisma migrate`
// and `prisma db ...` pick up DATABASE_URL the same way Next.js does.
loadDotenv({ path: ".env.local", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
