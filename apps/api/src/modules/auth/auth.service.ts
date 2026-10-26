import type { RegisterInput } from "@messaging-app/shared";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { hashPassword } from "./password.ts";
import { publicUserSelect } from "./public-user.ts";
import { createSession } from "./session.ts";

export const registerUser = async (prisma: PrismaClient, input: RegisterInput) => {
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
    select: publicUserSelect,
  });

  const { token, expiresAt } = await createSession(prisma, user.id);

  return { user, token, expiresAt };
};
