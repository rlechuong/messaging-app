import { z } from "zod";

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarPublicId: z.string().nullable(),
  bio: z.string().nullable(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const authResponseSchema = z.object({ user: publicUserSchema });

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
