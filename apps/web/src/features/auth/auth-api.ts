import { authResponseSchema, type LoginInput, type RegisterInput } from "@messaging-app/shared";
import { z } from "zod";
import { ApiError, apiFetch } from "../../lib/api-client.ts";

export const registerUser = async (input: RegisterInput) => {
  const { user } = await apiFetch("/api/auth/register", {
    method: "POST",
    body: input,
    schema: authResponseSchema,
  });

  return user;
};

export const loginUser = async (input: LoginInput) => {
  const { user } = await apiFetch("/api/auth/login", {
    method: "POST",
    body: input,
    schema: authResponseSchema,
  });

  return user;
};

export const logoutUser = async () => {
  await apiFetch("/api/auth/logout", { method: "POST", schema: z.undefined() });
};

export const getCurrentUser = async () => {
  try {
    const { user } = await apiFetch("/api/auth/me", { schema: authResponseSchema });
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
};
