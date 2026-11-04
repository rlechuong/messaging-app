import type { PrismaClient } from "../../generated/prisma/client.ts";
import { userSummarySelect } from "./user-summary.ts";

type SearchUsersParams = {
  search: string;
  excludeUserId: string;
};

export const searchUsers = (prisma: PrismaClient, { search, excludeUserId }: SearchUsersParams) => {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ],
    },
    select: userSummarySelect,
    orderBy: { username: "asc" },
    take: 20,
  });
};
