export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  messages: (conversationId: string) =>
    [...conversationKeys.all, conversationId, "messages"] as const,
};

export const userKeys = {
  search: (search: string) => ["users", "search", search] as const,
};
