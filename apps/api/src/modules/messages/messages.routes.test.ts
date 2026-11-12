import {
  conversationsResponseSchema,
  messageResponseSchema,
  messagesResponseSchema,
} from "@messaging-app/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createLoggedInAgent, sendTestMessage, startConversation } from "../../test/agent.ts";
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

describe("GET /api/conversations/:conversationId/messages", () => {
  it("responds 401 without a session", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await request(app).get(`/api/conversations/${conversation.id}/messages`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: "Not authenticated." } });
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

    const response = await agent.get(`/api/conversations/${conversation.id}/messages`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Conversation not found." } });
  });

  it("responds 404 for a conversation that doesn't exist", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);

    const response = await agent.get(`/api/conversations/${crypto.randomUUID()}/messages`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Conversation not found." } });
  });

  it("responds 400 for a limit above 50", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 51 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(["error", "fieldErrors", "limit"]);
  });

  it("responds 400 for a before cursor that isn't a UUID", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 2, before: "not-a-uuid" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(["error", "fieldErrors", "before"]);
  });

  it("returns an empty messages array and null nextCursor for an empty conversation", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);

    const response = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ messages: [], nextCursor: null });
  });

  it("returns messages newest first", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);
    const firstMessage = await sendTestMessage(agent, conversation.id, "First message.");
    const secondMessage = await sendTestMessage(agent, conversation.id, "Second message.");
    const thirdMessage = await sendTestMessage(agent, conversation.id, "Third message.");

    const response = await agent.get(`/api/conversations/${conversation.id}/messages`);
    expect(response.status).toBe(200);
    const { messages } = messagesResponseSchema.parse(response.body);

    expect(messages.map((message) => message.id)).toEqual([
      thirdMessage.id,
      secondMessage.id,
      firstMessage.id,
    ]);
  });

  it("paginates older messages with the before cursor", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);
    const firstMessage = await sendTestMessage(agent, conversation.id, "First message.");
    const secondMessage = await sendTestMessage(agent, conversation.id, "Second message.");
    const thirdMessage = await sendTestMessage(agent, conversation.id, "Third message.");

    const firstPage = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 2 });
    expect(firstPage.status).toBe(200);
    const { messages: firstMessages, nextCursor: firstCursor } = messagesResponseSchema.parse(
      firstPage.body,
    );
    expect(firstMessages).toEqual([thirdMessage, secondMessage]);
    expect(firstCursor).toBe(secondMessage.id);

    const secondPage = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 2, before: firstCursor });
    expect(secondPage.status).toBe(200);
    const { messages: secondMessages, nextCursor: secondCursor } = messagesResponseSchema.parse(
      secondPage.body,
    );
    expect(secondMessages).toEqual([firstMessage]);
    expect(secondCursor).toBeNull();
  });

  it("returns a null cursor when the last page is exactly full", async () => {
    const app = createTestApp();
    const { agent } = await createLoggedInAgent(app);
    const secondUser = await createTestUser({
      email: "thomas@example.com",
      username: "thomas",
    });
    const conversation = await startConversation(agent, secondUser.id);
    const firstMessage = await sendTestMessage(agent, conversation.id, "First message.");
    const secondMessage = await sendTestMessage(agent, conversation.id, "Second message.");

    const response = await agent
      .get(`/api/conversations/${conversation.id}/messages`)
      .query({ limit: 2 });
    expect(response.status).toBe(200);
    const { messages, nextCursor } = messagesResponseSchema.parse(response.body);

    expect(messages).toEqual([secondMessage, firstMessage]);
    expect(nextCursor).toBeNull();
  });
});
