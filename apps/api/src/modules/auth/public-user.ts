import type { Prisma } from "../../generated/prisma/client.ts";

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarPublicId: true,
  bio: true,
} satisfies Prisma.UserSelect;
