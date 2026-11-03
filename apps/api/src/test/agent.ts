import { authResponseSchema, type RegisterInput } from "@messaging-app/shared";
import type { Express } from "express";
import request from "supertest";

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
