import { execSync } from "node:child_process";
import { getTestDatabaseUrl } from "./test-database-url.ts";

export const setup = () => {
  getTestDatabaseUrl();

  execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
};
