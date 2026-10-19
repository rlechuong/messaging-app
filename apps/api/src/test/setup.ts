import { beforeEach, afterAll } from "vitest";
import { testPrisma, resetDatabase } from "./database.ts";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
