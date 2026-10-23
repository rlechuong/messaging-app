import { describe, it, expect } from "vitest";
import type { ZodType } from "zod";
import { registerSchema, loginSchema } from "./auth.ts";

const validRegisterInput = {
  email: "richard@example.com",
  username: "richard",
  password: "the art of war is strong",
};

const validLoginInput = {
  email: "richard@example.com",
  password: "the art of war is strong",
};

const errorPaths = (schema: ZodType, input: unknown) =>
  schema.safeParse(input).error?.issues.map((issue) => issue.path);

describe("registerSchema", () => {
  it("normalizes the email and username", () => {
    const result = registerSchema.parse({
      ...validRegisterInput,
      email: "  Richard@Example.COM ",
      username: " Richard ",
    });

    expect(result.email).toBe("richard@example.com");
    expect(result.username).toBe("richard");
  });

  it.each([
    ["is too short", "ab"],
    ["is too long", "a".repeat(21)],
    ["has a hyphen", "rich-ard"],
    ["has a space", "rich ard"],
  ])("rejects a username that %s", (_description, username) => {
    expect(errorPaths(registerSchema, { ...validRegisterInput, username })).toEqual([["username"]]);
  });

  it.each([
    ["is exactly 3 characters", "abc"],
    ["is exactly 20 characters", "a".repeat(20)],
    ["has numbers and underscores", "rich_ard_81"],
  ])("accepts a username that %s", (_description, username) => {
    expect(errorPaths(registerSchema, { ...validRegisterInput, username })).toBeUndefined();
  });

  it("rejects an invalid email", () => {
    const result = errorPaths(registerSchema, { ...validRegisterInput, email: "richard" });

    expect(result).toEqual([["email"]]);
  });

  it.each([
    ["is too short", "a".repeat(14)],
    ["is too long", "a".repeat(129)],
  ])("rejects a password that %s", (_description, password) => {
    expect(errorPaths(registerSchema, { ...validRegisterInput, password })).toEqual([["password"]]);
  });

  it.each([
    ["is exactly 15 characters", "a".repeat(15)],
    ["is exactly 128 characters", "a".repeat(128)],
    ["has spaces and emoji", "the art of war is strong 💪"],
  ])("accepts a password that %s", (_description, password) => {
    expect(errorPaths(registerSchema, { ...validRegisterInput, password })).toBeUndefined();
  });

  it("does not trim the password", () => {
    const password = "  the art of war is strong  ";

    const result = registerSchema.parse({ ...validRegisterInput, password });

    expect(result.password).toBe(password);
  });
});

describe("loginSchema", () => {
  it("normalizes the email", () => {
    const result = loginSchema.parse({ ...validLoginInput, email: "  Richard@Example.COM " });

    expect(result.email).toBe("richard@example.com");
  });

  it.each([
    ["is empty", ""],
    ["is too long", "a".repeat(129)],
  ])("rejects a password that %s", (_description, password) => {
    expect(errorPaths(loginSchema, { ...validLoginInput, password })).toEqual([["password"]]);
  });

  it("accepts a password shorter than the registration minimum", () => {
    const result = errorPaths(loginSchema, { ...validLoginInput, password: "a".repeat(9) });

    expect(result).toBeUndefined();
  });
});
