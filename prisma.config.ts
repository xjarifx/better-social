import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config();

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL?.trim() || "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
