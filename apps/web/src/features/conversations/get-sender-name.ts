import type { UserSummary } from "@messaging-app/shared";

export const getSenderName = (
  senderId: string | null,
  members: UserSummary[],
  currentUserId: string,
): string => {
  if (senderId === currentUserId) {
    return "You";
  }

  const member = members.find((member) => member.id === senderId);

  return member ? (member.displayName ?? member.username) : "Deleted user";
};
