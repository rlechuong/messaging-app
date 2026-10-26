import express from "express";
import type { PrismaClient } from "./generated/prisma/client.ts";
import { HttpError } from "./lib/http-error.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { createAuthRouter } from "./modules/auth/auth.routes.ts";

export type AppDependencies = {
  prisma: PrismaClient;
  secureCookies: boolean;
};

export const createApp = ({ prisma, secureCookies }: AppDependencies) => {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter({ prisma, secureCookies }));

  app.use("/api", () => {
    throw new HttpError(404, "Not found");
  });

  app.use(errorHandler);

  return app;
};
