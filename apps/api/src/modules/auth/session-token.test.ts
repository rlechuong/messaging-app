import { describe, it, expect } from "vitest";
import { generateSessionToken, hashSessionToken } from "./session-token.ts";

describe("generateSessionToken", () => {
  it("returns a 43-character string", () => {
    const token = generateSessionToken();

    expect(token).toHaveLength(43);
  });

  it("returns a different token each time it's called", () => {
    const token = generateSessionToken();
    const otherToken = generateSessionToken();

    expect(token).not.toBe(otherToken);
  });
});

describe("hashSessionToken", () => {
  it("produces the SHA-256 hex digest", () => {
    const hashedToken = hashSessionToken("abc");

    expect(hashedToken).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("returns a 64-character hex string", () => {
    const token = generateSessionToken();
    const hashedToken = hashSessionToken(token);

    expect(hashedToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns the same hash for the same token", () => {
    const token = generateSessionToken();
    const hashedToken = hashSessionToken(token);
    const sameHashedToken = hashSessionToken(token);

    expect(hashedToken).toBe(sameHashedToken);
  });

  it("returns different hashes for different tokens", () => {
    const token = generateSessionToken();
    const otherToken = generateSessionToken();
    const hashedToken = hashSessionToken(token);
    const otherHashedToken = hashSessionToken(otherToken);

    expect(hashedToken).not.toBe(otherHashedToken);
  });

  it("does not return the token itself", () => {
    const token = generateSessionToken();
    const hashedToken = hashSessionToken(token);

    expect(hashedToken).not.toBe(token);
  });
});
