import { useQuery } from "@tanstack/react-query";
import { getConversations } from "./conversations-api.ts";
import { conversationKeys } from "./conversation-keys.ts";

export const useConversations = () =>
  useQuery({
    queryKey: conversationKeys.list(),
    queryFn: getConversations,
  });
