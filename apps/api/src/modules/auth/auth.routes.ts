import express, { type Response } from "express";
import { loginSchema, registerSchema } from "@messaging-app/shared";
import type { AppDependencies } from "../../app.ts";
import { SESSION_COOKIE_NAME } from "./session.ts";
import { loginUser, registerUser } from "./auth.service.ts";

const setSessionCookie = (res: Response, token: string, expiresAt: Date, secure: boolean) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
};

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
