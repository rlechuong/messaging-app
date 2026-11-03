import type { Prisma } from "../../generated/prisma/client.ts";
import { userSummarySelect } from "../users/user-summary.ts";

export const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  senderId: true,
  conversationId: true,
} satisfies Prisma.MessageSelect;

export const conversationSelect = {
  id: true,
  type: true,
  name: true,
  lastMessageAt: true,
  members: {
    select: { user: { select: userSummarySelect } },
  },
  messages: {
    orderBy: { id: "desc" },
    take: 1,
    select: messageSelect,
  },
} satisfies Prisma.ConversationSelect;

type SelectedConversation = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

export const toConversationResponse = (conversation: SelectedConversation) => ({
  id: conversation.id,
  type: conversation.type,
  name: conversation.name,
  lastMessageAt: conversation.lastMessageAt,
  members: conversation.members.map((member) => member.user),
  latestMessage: conversation.messages[0] ?? null,
});
