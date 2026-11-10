import {
  authResponseSchema,
  conversationResponseSchema,
  type RegisterInput,
} from "@messaging-app/shared";
import type { Express } from "express";
import request from "supertest";

type TestAgent = ReturnType<typeof request.agent>;

export const createLoggedInAgent = async (app: Express, overrides: Partial<RegisterInput> = {}) => {
  const agent = request.agent(app);

  const response = await agent.post("/api/auth/register").send({
    email: "richard@example.com",
    username: "richard",
    password: "the art of war is strong",
    ...overrides,
  });

  if (response.status !== 201) {
    throw new Error(`Test registration failed with ${response.status}`);
  }

  const { user } = authResponseSchema.parse(response.body);

  return { agent, user };
};

export const startConversation = async (agent: TestAgent, userId: string) => {
  const response = await agent.post("/api/conversations").send({ type: "DIRECT", userId });

  if (response.status !== 201) {
    throw new Error(`Starting conversation failed with ${response.status}`);
  }

  return conversationResponseSchema.parse(response.body).conversation;
};
