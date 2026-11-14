import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationKeys } from "./conversation-keys.ts";
import { getMessages } from "./conversations-api.ts";

export const useMessages = (conversationId: string) =>
  useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: ({ pageParam }) => getMessages({ conversationId, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
