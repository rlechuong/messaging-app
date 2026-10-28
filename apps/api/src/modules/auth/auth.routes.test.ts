import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../../test/app.ts";
import { testPrisma } from "../../test/database.ts";
import { createTestUser } from "../../test/factories.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { DAY_MS, SESSION_RENEWAL_THRESHOLD_MS } from "./session.ts";

const validRegisterInput = {
  email: "richard@example.com",
  username: "richard",
  password: "the art of war is strong",
};

const validLoginInput = {
  email: "richard@example.com",
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

  it("rejects a taken email with 409", async () => {
    const app = createTestApp();
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterInput, username: "richard2" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: "Email is already in use." } });
    expect(await testPrisma.user.count()).toBe(1);
  });

  it("rejects a taken username with 409", async () => {
    const app = createTestApp();
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterInput, email: "richard2@example.com" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: "Username is already taken." } });
    expect(await testPrisma.user.count()).toBe(1);
  });

  it("treats emails as case-insensitive", async () => {
    const app = createTestApp();
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterInput, email: "Richard@Example.COM", username: "richard2" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: "Email is already in use." } });
    expect(await testPrisma.user.count()).toBe(1);
  });

  it("allows only one of two simultaneous identical registrations", async () => {
    const app = createTestApp();

    const [first, second] = await Promise.all([
      request(app).post("/api/auth/register").send(validRegisterInput),
      request(app).post("/api/auth/register").send(validRegisterInput),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);

    expect(statuses).toEqual([201, 409]);
    expect(await testPrisma.user.count()).toBe(1);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await createTestUser({ passwordHash: await hashPassword(validLoginInput.password) });
  });

  it("responds 200 with the user and sets a session cookie", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/auth/login").send(validLoginInput);

    const cookie = response.get("Set-Cookie")?.[0];

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        email: "richard@example.com",
        username: "richard",
      },
    });
    expect(cookie).toContain("HttpOnly");
  });

  it("never returns passwordHash", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/auth/login").send(validLoginInput);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty(["user", "passwordHash"]);
  });

  it("rejects a wrong password with 401 and a generic message and creates no session", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ ...validLoginInput, password: "the art of war is weak" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Invalid email or password." } });
    expect(await testPrisma.session.count()).toBe(0);
  });

  it("responds identically to an unknown email and a wrong password", async () => {
    const app = createTestApp();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ ...validLoginInput, password: "the art of war is weak" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ ...validLoginInput, email: "nobody@example.com" });

    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("accepts the email in any case", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ ...validLoginInput, email: "Richard@Example.COM" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        email: "richard@example.com",
        username: "richard",
      },
    });
  });

  it("rejects an empty password with 400", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ ...validLoginInput, password: "" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { message: "Validation failed", fieldErrors: { password: ["Password is required."] } },
    });
  });
});

describe("GET /api/auth/me", () => {
  it("returns the logged-in user after registering", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: { email: "richard@example.com", username: "richard" },
    });
  });

  it("returns the logged-in user after logging in", async () => {
    const app = createTestApp();
    await createTestUser({ passwordHash: await hashPassword(validLoginInput.password) });
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send(validLoginInput);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: { email: "richard@example.com", username: "richard" },
    });
  });

  it("doesn't refresh the cookie for a fresh session", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.get("Set-Cookie")).toBeUndefined();
  });

  it("refreshes the cookie when the session is renewed", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);
    await testPrisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() + SESSION_RENEWAL_THRESHOLD_MS - DAY_MS) },
    });

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.get("Set-Cookie")).toEqual([expect.stringMatching(/^session=/)]);
  });

  it("never returns passwordHash", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty(["user", "passwordHash"]);
  });

  it("responds 401 without a session cookie", async () => {
    const app = createTestApp();

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("responds 401 and clears the cookie for an invalid token", async () => {
    const app = createTestApp();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "session=not-a-real-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
    expect(response.get("Set-Cookie")).toEqual([expect.stringMatching(/^session=;/)]);
  });

  it("responds 401 for an expired session", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);
    await testPrisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });
});

describe("POST /api/auth/logout", () => {
  it("responds 204 and clears the cookie", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    const response = await agent.post("/api/auth/logout");

    expect(response.status).toBe(204);
    expect(response.get("Set-Cookie")).toEqual([expect.stringMatching(/^session=;/)]);
  });

  it("ends the session", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    await agent.post("/api/auth/logout");
    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("deletes the session from the database", async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(validRegisterInput);

    await agent.post("/api/auth/logout");

    expect(await testPrisma.session.count()).toBe(0);
  });

  it("doesn't log out the user's other device", async () => {
    const app = createTestApp();
    const firstAgent = request.agent(app);
    const secondAgent = request.agent(app);
    await firstAgent.post("/api/auth/register").send(validRegisterInput);
    await secondAgent.post("/api/auth/login").send(validLoginInput);
    await firstAgent.post("/api/auth/logout");

    const firstDevice = await firstAgent.get("/api/auth/me");
    const secondDevice = await secondAgent.get("/api/auth/me");

    expect(firstDevice.status).toBe(401);
    expect(secondDevice.status).toBe(200);
  });

  it("responds 401 when not logged in", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });
});
