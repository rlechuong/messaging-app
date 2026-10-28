import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.ts";

const password = "the art of war";

describe("hashPassword", () => {
  it("returns an Argon2id hash, not the password", async () => {
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("hashes differently for the same password each time", async () => {
    const firstPasswordHash = await hashPassword(password);
    const secondPasswordHash = await hashPassword(password);

    expect(firstPasswordHash).not.toBe(secondPasswordHash);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const passwordHash = await hashPassword(password);

    expect(await verifyPassword(passwordHash, password)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const passwordHash = await hashPassword(password);

    expect(await verifyPassword(passwordHash, "Sun Tzu")).toBe(false);
  });
});
