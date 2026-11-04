import { conversationResponseSchema, conversationsResponseSchema } from "@messaging-app/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createLoggedInAgent, type TestAgent } from "../../test/agent.ts";
import { createTestApp } from "../../test/app.ts";
import { testPrisma } from "../../test/database.ts";
import { createTestUser } from "../../test/factories.ts";

const startConversation = async (agent: TestAgent, userId: string) => {
  const response = await agent.post("/api/conversations").send({ type: "DIRECT", userId });

  if (response.status !== 201) {
    throw new Error(`Starting conversation failed with ${response.status}`);
  }

  return conversationResponseSchema.parse(response.body).conversation;
};

describe("POST /api/conversations", () => {
  it("responds 401 without a session", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/conversations");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("creates a DM and responds 201 with both members", async () => {
    const app = createTestApp();
    const otherUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const { agent, user } = await createLoggedInAgent(app);

    const response = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: otherUser.id });
    expect(response.status).toBe(201);
    const { conversation } = conversationResponseSchema.parse(response.body);
    const memberIds = conversation.members.map((member) => member.id).sort();

    expect(memberIds).toEqual([user.id, otherUser.id].sort());
    expect(response.body).not.toHaveProperty(["conversation", "members", 0, "email"]);
    expect(conversation.type).toBe("DIRECT");
    expect(conversation.latestMessage).toBeNull();
    expect(conversation.lastMessageAt).toBeNull();
  });

  it("returns the existing DM with 200 when started a second time", async () => {
    const app = createTestApp();
    const otherUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const { agent } = await createLoggedInAgent(app);

    const firstResponse = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: otherUser.id });
    expect(firstResponse.status).toBe(201);
    const { conversation: firstConversation } = conversationResponseSchema.parse(
      firstResponse.body,
    );

    const secondResponse = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: otherUser.id });
    expect(secondResponse.status).toBe(200);
    const { conversation: secondConversation } = conversationResponseSchema.parse(
      secondResponse.body,
    );

    expect(firstConversation.id).toBe(secondConversation.id);
  });

  it("returns the same DM when the other person starts it", async () => {
    const app = createTestApp();
    const { agent, user } = await createLoggedInAgent(app);
    const { agent: otherAgent, user: otherUser } = await createLoggedInAgent(app, {
      email: "thomas@example.com",
      username: "thomas",
    });

    const response = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: otherUser.id });
    expect(response.status).toBe(201);
    const { conversation } = conversationResponseSchema.parse(response.body);

    const otherResponse = await otherAgent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: user.id });
    expect(otherResponse.status).toBe(200);
    const { conversation: otherConversation } = conversationResponseSchema.parse(
      otherResponse.body,
    );

    expect(conversation.id).toBe(otherConversation.id);
  });

  it("responds 400 when starting a DM with yourself", async () => {
    const app = createTestApp();
    const { agent, user } = await createLoggedInAgent(app);

    const response = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: user.id });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { message: "You can't start a conversation with yourself." },
    });
  });

  it("responds 404 for a user that doesn't exist", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent
      .post("/api/conversations")
      .send({ type: "DIRECT", userId: crypto.randomUUID() });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { message: "User not found." },
    });
  });

  it("responds 400 for an unknown conversation type", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.post("/api/conversations").send({ type: "INVALID" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(["error", "fieldErrors", "type"]);
  });

  it("responds 400 when a direct conversation has no userId", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.post("/api/conversations").send({ type: "DIRECT" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(["error", "fieldErrors", "userId"]);
  });

  it("only creates one conversation from two simultaneous requests", async () => {
    const app = createTestApp();
    const otherUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const { agent } = await createLoggedInAgent(app);

    const [first, second] = await Promise.all([
      agent.post("/api/conversations").send({ type: "DIRECT", userId: otherUser.id }),
      agent.post("/api/conversations").send({ type: "DIRECT", userId: otherUser.id }),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);

    expect(statuses).toEqual([200, 201]);
    expect(await testPrisma.conversation.count()).toBe(1);
  });
});

describe("GET /api/conversations", () => {
  it("responds 401 without a session", async () => {
    const app = createTestApp();

    const response = await request(app).get("/api/conversations");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("returns an empty list for a new user", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get("/api/conversations");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ conversations: [] });
  });

  it("includes only conversations the user is a member of", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const { agent: secondAgent, user: secondUser } = await createLoggedInAgent(app, {
      email: "thomas@example.com",
      username: "thomas",
    });
    const thirdUser = await createTestUser({
      email: "lam@example.com",
      username: "lam",
    });

    const ownConversation = await startConversation(agent, secondUser.id);
    await startConversation(secondAgent, thirdUser.id);

    const response = await agent.get("/api/conversations");
    expect(response.status).toBe(200);
    const { conversations } = conversationsResponseSchema.parse(response.body);

    expect(conversations.map((conversation) => conversation.id)).toEqual([ownConversation.id]);
  });

  it("orders conversations from newest to oldest", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const thirdUser = await createTestUser({
      email: "lam@example.com",
      username: "lam",
    });
    const fourthUser = await createTestUser({
      email: "ba@example.com",
      username: "ba",
    });

    const newerConversation = await startConversation(agent, secondUser.id);
    const olderConversation = await startConversation(agent, thirdUser.id);
    const nullConversation = await startConversation(agent, fourthUser.id);

    const newerDate = new Date(Date.now() + 60_000);
    const olderDate = new Date(Date.now() - 60_000);

    await testPrisma.conversation.update({
      where: { id: newerConversation.id },
      data: { lastMessageAt: newerDate },
    });

    await testPrisma.conversation.update({
      where: { id: olderConversation.id },
      data: { lastMessageAt: olderDate },
    });

    const response = await agent.get("/api/conversations");
    expect(response.status).toBe(200);
    const { conversations } = conversationsResponseSchema.parse(response.body);
    const conversationIds = conversations.map((conversation) => conversation.id);

    expect(conversationIds).toEqual([
      newerConversation.id,
      olderConversation.id,
      nullConversation.id,
    ]);
  });
});
