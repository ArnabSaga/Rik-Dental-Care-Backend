import "dotenv/config";
import { defineConfig } from "prisma/config";
import { envVars } from "./src/app/config/env";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: envVars.DATABASE_URL,
  },
});
