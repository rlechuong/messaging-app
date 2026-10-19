import { describe, it, expect } from "vitest";
import { testPrisma, resetDatabase } from "./database.ts";

describe("resetDatabase", () => {
  it("removes all rows from every table", async () => {
    await testPrisma.user.create({
      data: {
        email: "richard@example.com",
        username: "richard",
        passwordHash: "hash",
      },
    });
    await testPrisma.conversation.create({
      data: {
        type: "DIRECT",
      },
    });

    await resetDatabase();

    expect(await testPrisma.user.count()).toBe(0);
    expect(await testPrisma.conversation.count()).toBe(0);
  });
});
