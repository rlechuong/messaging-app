import type { PrismaClient } from "../../generated/prisma/client.ts";
import { HttpError } from "../../lib/http-error.ts";
import { messageSelect } from "../conversations/conversation-response.ts";

type AssertConversationMemberParams = {
  conversationId: string;
  userId: string;
};

type SendMessageParams = {
  conversationId: string;
  senderId: string;
  content: string;
};

type ListMessagesParams = {
  conversationId: string;
  before?: string;
  limit: number;
};

export const assertConversationMember = async (
  prisma: PrismaClient,
  { conversationId, userId }: AssertConversationMemberParams,
) => {
  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
    select: { userId: true },
  });

  if (!membership) throw new HttpError(404, "Conversation not found.");
};

export const sendMessage = async (
  prisma: PrismaClient,
  { conversationId, senderId, content }: SendMessageParams,
) => {
  const now = new Date();

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId, content, createdAt: now },
      select: messageSelect,
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    }),
  ]);

  return message;
};

export const listMessages = async (
  prisma: PrismaClient,
  { conversationId, before, limit }: ListMessagesParams,
) => {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(before ? { id: { lt: before } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit + 1,
    select: messageSelect,
  });

  const hasMore = messages.length > limit;
  const page = messages.slice(0, limit);
  const nextCursor = hasMore ? (page.at(-1)?.id ?? null) : null;

  return { messages: page, nextCursor };
};
