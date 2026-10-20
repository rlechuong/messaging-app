import { describe, it, expect } from "vitest";
import { testPrisma } from "../../test/database.ts";
import { createTestUser } from "../../test/factories.ts";
import {
  DAY_MS,
  SESSION_DURATION_MS,
  SESSION_RENEWAL_THRESHOLD_MS,
  createSession,
  validateSessionToken,
} from "./session.ts";
import { generateSessionToken, hashSessionToken } from "./session-token.ts";

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

describe("validateSessionToken", () => {
  it("returns the session and user for a valid token", async () => {
    const user = await createTestUser();
    const { token, expiresAt } = await createSession(testPrisma, user.id);

    const result = await validateSessionToken(testPrisma, token);

    expect(result).toMatchObject({
      session: { expiresAt },
      user: { id: user.id, email: user.email, username: user.username },
    });
  });

  it("returns null for a token that was never issued", async () => {
    const token = generateSessionToken();

    const result = await validateSessionToken(testPrisma, token);

    expect(result).toBeNull();
  });

  it("returns null and deletes the session for an expired token", async () => {
    const user = await createTestUser();
    const { token } = await createSession(testPrisma, user.id);
    await testPrisma.session.update({
      where: {
        tokenHash: hashSessionToken(token),
      },
      data: {
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const result = await validateSessionToken(testPrisma, token);
    const storedSession = await testPrisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
    });

    expect(result).toBeNull();
    expect(storedSession).toBeNull();
  });

  it("extends expiresAt when the session is within the renewal threshold", async () => {
    const user = await createTestUser();
    const { token } = await createSession(testPrisma, user.id);
    await testPrisma.session.update({
      where: {
        tokenHash: hashSessionToken(token),
      },
      data: {
        expiresAt: new Date(Date.now() + SESSION_RENEWAL_THRESHOLD_MS - DAY_MS),
      },
    });

    const before = Date.now();
    const result = await validateSessionToken(testPrisma, token);
    const after = Date.now();
    if (!result) throw new Error("Expected a valid session.");

    const storedSession = await testPrisma.session.findUniqueOrThrow({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });

    expect(result.session.expiresAt).toEqual(storedSession.expiresAt);
    expect(storedSession.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_DURATION_MS);
    expect(storedSession.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_DURATION_MS);
  });

  it("doesn't change expiresAt when the session is fresh", async () => {
    const user = await createTestUser();
    const { token, expiresAt } = await createSession(testPrisma, user.id);

    const result = await validateSessionToken(testPrisma, token);

    expect(result).toMatchObject({ session: { expiresAt } });
  });

  it("never includes passwordHash in the returned user", async () => {
    const user = await createTestUser();
    const { token } = await createSession(testPrisma, user.id);

    const result = await validateSessionToken(testPrisma, token);
    if (!result) throw new Error("Expected a valid session.");

    expect(result.user).not.toHaveProperty("passwordHash");
  });
});
