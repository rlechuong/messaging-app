import type { ErrorRequestHandler } from "express";
import { z, ZodError } from "zod";
import { HttpError } from "../lib/http-error.ts";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        fieldErrors: z.flattenError(err).fieldErrors,
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: {
        message: "Malformed JSON",
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      message: "Internal server error",
    },
  });
};
