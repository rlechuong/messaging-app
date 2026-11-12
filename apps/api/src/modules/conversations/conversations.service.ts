import { Prisma, type PrismaClient } from "../../generated/prisma/client.ts";
import { HttpError } from "../../lib/http-error.ts";
import { conversationSelect } from "./conversation-response.ts";

type FindOrCreateDirectParams = {
  userId: string;
  otherUserId: string;
};

export const findOrCreateDirectConversation = async (
  prisma: PrismaClient,
  { userId, otherUserId }: FindOrCreateDirectParams,
) => {
  if (userId === otherUserId) {
    throw new HttpError(400, "You can't start a conversation with yourself.");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });

  if (!otherUser) throw new HttpError(404, "User not found.");

  const directKey = [userId, otherUserId].sort().join(":");

  const existingConversation = await prisma.conversation.findUnique({
    where: { directKey },
    select: conversationSelect,
  });

  if (existingConversation) {
    return { conversation: existingConversation, created: false };
  }

  try {
    const newConversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        directKey,
        members: { create: [{ userId }, { userId: otherUserId }] },
      },
      select: conversationSelect,
    });

    return { conversation: newConversation, created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const racedConversation = await prisma.conversation.findUniqueOrThrow({
        where: { directKey },
        select: conversationSelect,
      });

      return { conversation: racedConversation, created: false };
    }
    throw error;
  }
};

export const listConversations = (prisma: PrismaClient, userId: string) =>
  prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    select: conversationSelect,
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
  });
