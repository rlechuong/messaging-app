import type { RegisterInput } from "@messaging-app/shared";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.ts";
import { HttpError } from "../../lib/http-error.ts";
import { hashPassword } from "./password.ts";
import { publicUserSelect } from "./public-user.ts";
import { createSession } from "./session.ts";

const createUser = async (prisma: PrismaClient, data: Prisma.UserCreateInput) => {
  try {
    return await prisma.user.create({ data, select: publicUserSelect });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Email or username is already in use.");
    }
    throw error;
  }
};

export const registerUser = async (prisma: PrismaClient, input: RegisterInput) => {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true },
  });

  if (existingUser) {
    if (existingUser.email === input.email) {
      throw new HttpError(409, "Email is already in use.");
    }
    throw new HttpError(409, "Username is already taken.");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser(prisma, {
    email: input.email,
    username: input.username,
    passwordHash,
  });

  const { token, expiresAt } = await createSession(prisma, user.id);

  return { user, token, expiresAt };
};
