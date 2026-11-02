import { describe, it, expect } from "vitest";
import { sendMessageSchema, messagesQuerySchema } from "./conversations.ts";

describe("sendMessageSchema", () => {
  it("rejects a white-space only message", () => {
    const result = sendMessageSchema.safeParse({ content: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["content"]]);
  });
});

describe("messagesQuerySchema", () => {
  it("coerces a string limit to a number", () => {
    const result = messagesQuerySchema.parse({ limit: "20" });

    expect(result.limit).toBe(20);
  });

  it("defaults limit to 30 if omitted", () => {
    const result = messagesQuerySchema.parse({});

    expect(result.limit).toBe(30);
  });

  it("rejects a limit above the maximum", () => {
    const result = messagesQuerySchema.safeParse({ limit: "51" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["limit"]]);
  });
});
