import { conversationsResponseSchema, messageResponseSchema } from "@messaging-app/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createLoggedInAgent, startConversation } from "../../test/agent.ts";
import { createTestApp } from "../../test/app.ts";
import { createTestUser } from "../../test/factories.ts";

describe("POST /api/conversations/:conversationId/messages", () => {
  it("responds 401 without a session", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .send({ content: "Test message." });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
  });

  it("responds 201 with the message", async () => {
    const app = createTestApp();
    const { agent, user } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await agent
      .post(`/api/conversations/${conversation.id}/messages`)
      .send({ content: "Test message." });

    expect(response.status).toBe(201);
    expect(() => messageResponseSchema.parse(response.body)).not.toThrow();
    expect(response.body).toMatchObject({
      message: { content: "Test message.", senderId: user.id, conversationId: conversation.id },
    });
  });

  it("responds 404 for a conversation you're not a member of", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const { agent: secondAgent } = await createLoggedInAgent(app, {
      email: "thomas@example.com",
      username: "thomas",
    });
    const thirdUser = await createTestUser({
      email: "lam@example.com",
      username: "lam",
    });
    const conversation = await startConversation(secondAgent, thirdUser.id);

    const response = await agent
      .post(`/api/conversations/${conversation.id}/messages`)
      .send({ content: "Test message." });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Conversation not found." } });
  });

  it("responds 404 for a conversation that doesn't exist", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent
      .post(`/api/conversations/${crypto.randomUUID()}/messages`)
      .send({ content: "Test message." });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Conversation not found." } });
  });

  it("responds 400 for an invalid conversation ID", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent
      .post("/api/conversations/invalidUUID/messages")
      .send({ content: "Test message." });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(["error", "fieldErrors", "conversationId"]);
  });

  it("responds 400 for whitespace-only content", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await agent
      .post(`/api/conversations/${conversation.id}/messages`)
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fieldErrors: { content: ["Message can't be empty."] },
      },
    });
  });

  it("updates the conversation list", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);
    const messageResponse = await agent
      .post(`/api/conversations/${conversation.id}/messages`)
      .send({ content: "Test message." });
    expect(messageResponse.status).toBe(201);
    const parsedMessage = messageResponseSchema.parse(messageResponse.body);

    const conversationsResponse = await agent.get("/api/conversations");
    expect(conversationsResponse.status).toBe(200);
    const { conversations } = conversationsResponseSchema.parse(conversationsResponse.body);

    expect(conversations.map((conversation) => conversation.latestMessage)).toEqual([
      parsedMessage.message,
    ]);
    expect(conversations.map((conversation) => conversation.lastMessageAt)).toEqual([
      parsedMessage.message.createdAt,
    ]);
  });
});
