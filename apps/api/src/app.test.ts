import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.ts";

describe("GET /api/health", () => {
  it("responds with 200 and status ok", async () => {
    const app = createApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("API error responses", () => {
  it("returns a JSON 404 for an unknown /api route", async () => {
    const app = createApp();

    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Not found" } });
  });

  it("returns 400 for malformed JSON without logging an error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp();

    const response = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send('{ "email": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { message: "Malformed JSON" } });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
