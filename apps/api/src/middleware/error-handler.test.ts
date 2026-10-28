import express from "express";
import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { HttpError } from "../lib/http-error.ts";
import { errorHandler } from "./error-handler.ts";

const createErrorTestApp = () => {
  const app = express();

  app.get("/http-error", () => {
    throw new HttpError(409, "Email is already in use.");
  });

  app.get("/zod-error", () => {
    z.object({ name: z.string().min(3, "Name must be at least 3 characters.") }).parse({
      name: "ab",
    });
  });

  app.get("/unexpected-error", () => {
    throw new Error("Database password is suntzu");
  });

  app.use(errorHandler);
  return app;
};

describe("errorHandler", () => {
  it("responds to an HttpError with its status and message", async () => {
    const app = createErrorTestApp();

    const response = await request(app).get("/http-error");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: "Email is already in use." } });
  });

  it("responds to a ZodError with 400 and the field errors", async () => {
    const app = createErrorTestApp();

    const response = await request(app).get("/zod-error");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fieldErrors: { name: ["Name must be at least 3 characters."] },
      },
    });
  });

  it("responds to unexpected errors with 500 and a generic message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createErrorTestApp();

    const response = await request(app).get("/unexpected-error");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        message: "Internal server error",
      },
    });
    expect(response.text).not.toContain("suntzu");
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Database password is suntzu" }),
    );
  });
});
