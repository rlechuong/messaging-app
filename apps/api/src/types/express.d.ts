import type { AuthContext } from "../modules/auth/session.ts";

declare global {
  namespace Express {
    interface Locals {
      auth?: AuthContext;
    }
  }
}
