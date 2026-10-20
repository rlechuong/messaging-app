import { generateSessionToken, hashSessionToken } from "./session-token.ts";
import type { PrismaClient } from "../../generated/prisma/client.ts";

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const createSession = async (prisma: PrismaClient, userId: string) => {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
};
