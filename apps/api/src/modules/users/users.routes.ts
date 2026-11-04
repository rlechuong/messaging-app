import { userSearchQuerySchema } from "@messaging-app/shared";
import express from "express";
import type { AppDependencies } from "../../app.ts";
import { createRequireAuth, getAuth } from "../auth/require-auth.ts";
import { searchUsers } from "./users.service.ts";

export const createUsersRouter = ({ prisma, secureCookies }: AppDependencies) => {
  const router = express.Router();

  router.use(createRequireAuth({ prisma, secureCookies }));

  router.get("/", async (req, res) => {
    const { search } = userSearchQuerySchema.parse(req.query);
    const { user } = getAuth(res);

    const users = await searchUsers(prisma, { search, excludeUserId: user.id });

    res.json({ users });
  });

  return router;
};
