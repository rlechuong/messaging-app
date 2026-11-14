import {
  conversationResponseSchema,
  conversationsResponseSchema,
  messageResponseSchema,
  messagesResponseSchema,
  usersResponseSchema,
  type CreateConversationInput,
} from "@messaging-app/shared";
import { apiFetch } from "../../lib/api-client.ts";

export const getMessages = ({
  conversationId,
  before,
}: {
  conversationId: string;
  before?: string | undefined;
}) => {
  const params = new URLSearchParams();
  if (before) params.set("before", before);

  const query = params.toString();
  const path = `/api/conversations/${conversationId}/messages`;

  return apiFetch(query ? `${path}?${query}` : path, { schema: messagesResponseSchema });
};

export const getConversations = async () => {
  const { conversations } = await apiFetch("/api/conversations", {
    schema: conversationsResponseSchema,
  });

  return conversations;
};

export const startConversation = async (input: CreateConversationInput) => {
  const { conversation } = await apiFetch("/api/conversations", {
    method: "POST",
    body: input,
    schema: conversationResponseSchema,
  });

  return conversation;
};

export const sendMessage = async ({
  conversationId,
  content,
}: {
  conversationId: string;
  content: string;
}) => {
  const { message } = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: { content },
    schema: messageResponseSchema,
  });

  return message;
};

export const searchUsers = async (search: string) => {
  const params = new URLSearchParams({ search });

  const { users } = await apiFetch(`/api/users?${params}`, { schema: usersResponseSchema });

  return users;
};
