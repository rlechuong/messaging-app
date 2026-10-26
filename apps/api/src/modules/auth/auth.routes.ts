import express from "express";
import { loginSchema, registerSchema } from "@messaging-app/shared";
import type { AppDependencies } from "../../app.ts";
import { loginUser, registerUser } from "./auth.service.ts";
import { setSessionCookie } from "./session-cookie.ts";

export const createAuthRouter = ({ prisma, secureCookies }: AppDependencies) => {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const input = registerSchema.parse(req.body);

    const { user, token, expiresAt } = await registerUser(prisma, input);

    setSessionCookie(res, token, expiresAt, secureCookies);

    res.status(201).json({ user });
  });

  router.post("/login", async (req, res) => {
    const input = loginSchema.parse(req.body);

    const { user, token, expiresAt } = await loginUser(prisma, input);

    setSessionCookie(res, token, expiresAt, secureCookies);

    res.status(200).json({ user });
  });

  return router;
};
