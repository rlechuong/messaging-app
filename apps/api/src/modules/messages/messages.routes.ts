import { sendMessageSchema } from "@messaging-app/shared";
import express from "express";
import { z } from "zod";
import type { AppDependencies } from "../../app.ts";
import { getAuth } from "../auth/require-auth.ts";
import { assertConversationMember, sendMessage } from "./messages.service.ts";

const conversationParamsSchema = z.object({
  conversationId: z.uuid(),
});

export const createMessagesRouter = ({ prisma }: Pick<AppDependencies, "prisma">) => {
  const router = express.Router({ mergeParams: true });

  router.post("/", async (req, res) => {
    const { user } = getAuth(res);
    const { conversationId } = conversationParamsSchema.parse(req.params);
    const { content } = sendMessageSchema.parse(req.body);

    await assertConversationMember(prisma, { conversationId, userId: user.id });
    const message = await sendMessage(prisma, { conversationId, senderId: user.id, content });

    res.status(201).json({ message });
  });

  return router;
};
