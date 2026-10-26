import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "../../test/app.ts";
import { testPrisma } from "../../test/database.ts";
import { verifyPassword } from "./password.ts";

const validRegisterInput = {
  email: "richard@example.com",
  username: "richard",
  password: "the art of war is strong",
};

describe("POST /api/auth/register", () => {
  it("creates the user and responds 201 with the public user", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/auth/register").send(validRegisterInput);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      user: { email: "richard@example.com", username: "richard" },
    });
    expect(response.body).not.toHaveProperty(["user", "passwordHash"]);
  });

  it("stores a hashed password", async () => {
    const app = createTestApp();

    await request(app).post("/api/auth/register").send(validRegisterInput);

    const user = await testPrisma.user.findUniqueOrThrow({
      where: { email: validRegisterInput.email },
    });

    expect(await verifyPassword(user.passwordHash, validRegisterInput.password)).toBe(true);
  });

  it("sets an httpOnly session cookie and creates a session", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/auth/register").send(validRegisterInput);
    const cookie = response.get("Set-Cookie")?.[0];

    const user = await testPrisma.user.findUniqueOrThrow({
      where: { email: validRegisterInput.email },
    });

    const sessionCount = await testPrisma.session.count({
      where: {
        userId: user.id,
      },
    });

    expect(cookie).toMatch(/^session=/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(sessionCount).toBe(1);
  });

  it("responds 400 with field errors for invalid input", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterInput, username: "ab" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fieldErrors: { username: ["Username must be at least 3 characters."] },
      },
    });
    expect(await testPrisma.user.count()).toBe(0);
  });
});
