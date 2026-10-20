import { describe, it, expect } from "vitest";
import { testPrisma } from "../../test/database.ts";
import { createTestUser } from "../../test/factories.ts";
import { SESSION_DURATION_MS, createSession } from "./session.ts";
import { hashSessionToken } from "./session-token.ts";

describe("createSession", () => {
  it("stores only the hash of the token", async () => {
    const user = await createTestUser();

    const { token } = await createSession(testPrisma, user.id);

    const sessionByHash = await testPrisma.session.findUnique({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
    const sessionByPlainToken = await testPrisma.session.findUnique({
      where: {
        tokenHash: token,
      },
    });

    expect(sessionByHash).not.toBeNull();
    expect(sessionByPlainToken).toBeNull();
  });

  it("links the session to the user", async () => {
    const user = await createTestUser();

    const { token } = await createSession(testPrisma, user.id);

    const sessionByHash = await testPrisma.session.findUniqueOrThrow({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });

    expect(sessionByHash.userId).toBe(user.id);
  });

  it("sets expiresAt about 30 days in the future", async () => {
    const user = await createTestUser();
    const before = Date.now();
    const { token } = await createSession(testPrisma, user.id);
    const after = Date.now();

    const sessionByHash = await testPrisma.session.findUniqueOrThrow({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });

    expect(sessionByHash.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_DURATION_MS);
    expect(sessionByHash.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_DURATION_MS);
  });
});
