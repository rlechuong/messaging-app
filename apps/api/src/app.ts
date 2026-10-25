import express from "express";
import { HttpError } from "./lib/http-error.ts";
import { errorHandler } from "./middleware/error-handler.ts";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", () => {
    throw new HttpError(404, "Not found");
  });

  app.use(errorHandler);

  return app;
};
