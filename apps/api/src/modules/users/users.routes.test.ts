import { usersResponseSchema } from "@messaging-app/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createLoggedInAgent } from "../../test/agent.ts";
import { createTestApp } from "../../test/app.ts";
import { createTestUser } from "../../test/factories.ts";

describe("GET /api/users?search=", () => {
  it("responds 401 without a session", async () => {
    const app = createTestApp();

    const response = await request(app).get("/api/users?search=THOM");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("finds a user by a partial username, ignoring case", async () => {
    const app = createTestApp();
    await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
      displayName: "phuong",
    });
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/users?search=THOM");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      users: [{ username: "thomas", displayName: "phuong" }],
    });
  });

  it("finds a user by display name", async () => {
    const app = createTestApp();
    await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
      displayName: "phuong",
    });
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/users?search=phu");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      users: [{ username: "thomas", displayName: "phuong" }],
    });
  });

  it("doesn't include the user who is searching", async () => {
    const app = createTestApp();
    await createTestUser({
      email: "richard2@example.com",
      username: "richard2",
      displayName: "richard2",
    });
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/users?search=rich");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ users: [{ username: "richard2" }] });
  });

  it("never includes email or passwordHash", async () => {
    const app = createTestApp();
    const thomas = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
      displayName: "phuong",
    });
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/users?search=THOM");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      users: [
        {
          id: thomas.id,
          username: "thomas",
          displayName: "phuong",
          avatarPublicId: null,
          bio: null,
        },
      ],
    });

    expect(() => usersResponseSchema.parse(response.body)).not.toThrow();
  });

  it("responds 400 for an empty search", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/users?search=");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fieldErrors: { search: ["Enter a search term."] },
      },
    });
  });
});
