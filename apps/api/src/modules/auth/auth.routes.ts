import express from "express";
import type { AppDependencies } from "../../app.ts";
import { registerSchema } from "@messaging-app/shared";
import { SESSION_COOKIE_NAME } from "./session.ts";
import { registerUser } from "./auth.service.ts";

export const createAuthRouter = ({ prisma, secureCookies }: AppDependencies) => {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const input = registerSchema.parse(req.body);

    const { user, token, expiresAt } = await registerUser(prisma, input);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    res.status(201).json({ user });
  });

  return router;
};
