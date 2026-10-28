import type { Response } from "express";
import { SESSION_COOKIE_NAME } from "./session.ts";

const baseCookieOptions = { httpOnly: true, sameSite: "lax", path: "/" } as const;

export const setSessionCookie = (
  res: Response,
  token: string,
  expiresAt: Date,
  secure: boolean,
) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions,
    secure,
    expires: expiresAt,
  });
};

export const clearSessionCookie = (res: Response, secure: boolean) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...baseCookieOptions,
    secure,
  });
};
