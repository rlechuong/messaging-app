import { z } from "zod";
import { publicUserSchema } from "./api.ts";

export const userSummarySchema = publicUserSchema.omit({ email: true });
export type UserSummary = z.infer<typeof userSummarySchema>;

export const createConversationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("DIRECT"), userId: z.uuid() }),
]);
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const userSearchQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, "Enter a search term.")
    .max(50, "Search must be at most 50 characters."),
});
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;

export const messagesQuerySchema = z.object({
  before: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;

export const messageSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  createdAt: z.iso.datetime(),
  senderId: z.uuid().nullable(),
  conversationId: z.uuid(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.uuid(),
  type: z.enum(["DIRECT", "GROUP"]),
  name: z.string().nullable(),
  lastMessageAt: z.iso.datetime().nullable(),
  members: z.array(userSummarySchema),
  latestMessage: messageSchema.nullable(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationResponseSchema = z.object({
  conversation: conversationSchema,
});
export type ConversationResponse = z.infer<typeof conversationResponseSchema>;

export const conversationsResponseSchema = z.object({
  conversations: z.array(conversationSchema),
});
export type ConversationsResponse = z.infer<typeof conversationsResponseSchema>;

export const messageResponseSchema = z.object({
  message: messageSchema,
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const usersResponseSchema = z.object({
  users: z.array(userSummarySchema),
});
export type UsersResponse = z.infer<typeof usersResponseSchema>;

export const messagesResponseSchema = z.object({
  messages: z.array(messageSchema),
  nextCursor: z.uuid().nullable(),
});
export type MessagesResponse = z.infer<typeof messagesResponseSchema>;
