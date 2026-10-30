import { apiErrorResponseSchema } from "@messaging-app/shared";
import type { z } from "zod";

type ApiFetchOptions<TSchema extends z.ZodType> = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  schema: TSchema;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.name = "ApiError";
  }
}

export const apiFetch = async <TSchema extends z.ZodType>(
  path: string,
  { method = "GET", body, schema }: ApiFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> => {
  const hasBody = body !== undefined;

  const response = await fetch(path, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = apiErrorResponseSchema.safeParse(data);

    if (parsed.success) {
      throw new ApiError(response.status, parsed.data.error.message, parsed.data.error.fieldErrors);
    }

    throw new ApiError(response.status, "Something went wrong.");
  }

  return schema.parse(data);
};
