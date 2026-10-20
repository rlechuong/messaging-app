import { generateSessionToken, hashSessionToken } from "./session-token.ts";
import type { PrismaClient } from "../../generated/prisma/client.ts";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_DURATION_MS = 30 * DAY_MS;
export const SESSION_RENEWAL_THRESHOLD_MS = SESSION_DURATION_MS / 2;

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

export const validateSessionToken = async (prisma: PrismaClient, token: string) => {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarPublicId: true,
          bio: true,
        },
      },
    },
  });

  if (!session) return null;

  const now = Date.now();
  const expiresAtMs = session.expiresAt.getTime();

  if (now >= expiresAtMs) {
    await prisma.session.deleteMany({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  const shouldRenew = now >= expiresAtMs - SESSION_RENEWAL_THRESHOLD_MS;
  const expiresAt = shouldRenew ? new Date(now + SESSION_DURATION_MS) : session.expiresAt;

  if (shouldRenew) {
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt,
      },
    });
  }

  return { session: { id: session.id, expiresAt }, user: session.user };
};
