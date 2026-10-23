import type { Prisma } from "../generated/prisma/client.ts";
import { testPrisma } from "./database.ts";

export const createTestUser = (overrides: Partial<Prisma.UserCreateInput> = {}) =>
  testPrisma.user.create({
    data: {
      email: "richard@example.com",
      username: "richard",
      passwordHash: "hash",
      ...overrides,
    },
  });
