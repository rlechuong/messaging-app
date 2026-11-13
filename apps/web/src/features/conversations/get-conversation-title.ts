import type { Conversation } from "@messaging-app/shared";

export const getConversationTitle = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.name) return conversation.name;

  const otherMember = conversation.members.find((member) => member.id !== currentUserId);
  if (!otherMember) return "Deleted user";

  return otherMember.displayName ?? otherMember.username;
};
