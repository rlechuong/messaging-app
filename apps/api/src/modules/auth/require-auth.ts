import type { Response, RequestHandler } from "express";
import type { AppDependencies } from "../../app.ts";
import { HttpError } from "../../lib/http-error.ts";
import { SESSION_COOKIE_NAME, validateSessionToken, type AuthContext } from "./session.ts";
import { clearSessionCookie, setSessionCookie } from "./session-cookie.ts";

export const createRequireAuth = ({ prisma, secureCookies }: AppDependencies): RequestHandler => {
  return async (req, res, next) => {
    const cookies = req.cookies as Record<string, unknown>;
    const token = cookies[SESSION_COOKIE_NAME];

    if (typeof token !== "string") {
      throw new HttpError(401, "Not authenticated.");
    }

    const auth = await validateSessionToken(prisma, token);

    if (!auth) {
      clearSessionCookie(res, secureCookies);
      throw new HttpError(401, "Not authenticated.");
    }

    if (auth.renewed) {
      setSessionCookie(res, token, auth.session.expiresAt, secureCookies);
    }

    res.locals.auth = auth;

    next();
  };
};

export const getAuth = (res: Response): AuthContext => {
  const { auth } = res.locals;
  if (!auth) throw new HttpError(401, "Not authenticated.");
  return auth;
};
