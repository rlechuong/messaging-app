import { createConversationSchema } from "@messaging-app/shared";
import express from "express";
import type { AppDependencies } from "../../app.ts";
import { createRequireAuth, getAuth } from "../auth/require-auth.ts";
import { toConversationResponse } from "./conversation-response.ts";
import { findOrCreateDirectConversation, listConversations } from "./conversations.service.ts";

export const createConversationsRouter = ({ prisma, secureCookies }: AppDependencies) => {
  const router = express.Router();

  router.use(createRequireAuth({ prisma, secureCookies }));

  router.post("/", async (req, res) => {
    const { user } = getAuth(res);
    const input = createConversationSchema.parse(req.body);

    const { conversation, created } = await findOrCreateDirectConversation(prisma, {
      userId: user.id,
      otherUserId: input.userId,
    });

    res.status(created ? 201 : 200).json({ conversation: toConversationResponse(conversation) });
  });

  router.get("/", async (_req, res) => {
    const { user } = getAuth(res);
    const conversations = await listConversations(prisma, user.id);

    res.json({
      conversations: conversations.map((conversation) => toConversationResponse(conversation)),
    });
  });

  return router;
};
