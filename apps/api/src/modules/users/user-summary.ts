import type { Prisma } from "../../generated/prisma/client.ts";

export const userSummarySelect = {
  id: true,
  username: true,
  displayName: true,
  avatarPublicId: true,
  bio: true,
} satisfies Prisma.UserSelect;
