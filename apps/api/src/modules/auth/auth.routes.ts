import express from "express";
import { loginSchema, registerSchema } from "@messaging-app/shared";
import type { AppDependencies } from "../../app.ts";
import { loginUser, registerUser } from "./auth.service.ts";
import { createRequireAuth, getAuth } from "./require-auth.ts";
import { clearSessionCookie, setSessionCookie } from "./session-cookie.ts";
import { invalidateSession } from "./session.ts";

export const createAuthRouter = ({ prisma, secureCookies }: AppDependencies) => {
  const router = express.Router();

  const requireAuth = createRequireAuth({ prisma, secureCookies });

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

  router.get("/me", requireAuth, (_req, res) => {
    const { user } = getAuth(res);
    res.json({ user });
  });

  router.post("/logout", requireAuth, async (_req, res) => {
    const { session } = getAuth(res);
    await invalidateSession(prisma, session.id);
    clearSessionCookie(res, secureCookies);
    res.sendStatus(204);
  });

  return router;
};
