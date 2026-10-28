import type { LoginInput, RegisterInput } from "@messaging-app/shared";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.ts";
import { HttpError } from "../../lib/http-error.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { publicUserSelect } from "./public-user.ts";
import { createSession } from "./session.ts";

// Verified against when no user matches, so a login attempt with an unknown email takes the
// same time as one with a wrong password. Response time does not reveal existing emails.
const DUMMY_PASSWORD_HASH = await hashPassword("dummy password used for timing");

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

export const loginUser = async (prisma: PrismaClient, input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    input.password,
  );

  if (!user || !passwordMatches) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const { passwordHash, ...publicUser } = user;

  const { token, expiresAt } = await createSession(prisma, publicUser.id);

  return { user: publicUser, token, expiresAt };
};
