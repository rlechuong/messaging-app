import { z } from "zod";

const PASSWORD_MAX_LENGTH = 128;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const registerSchema = z.object({
  email: emailSchema,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores.",
    ),
  password: z
    .string()
    .min(15, "Password must be at least 15 characters.")
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export type LoginInput = z.infer<typeof loginSchema>;
