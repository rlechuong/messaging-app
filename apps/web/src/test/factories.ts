import type { UserSummary } from "@messaging-app/shared";

export const makeUser = (overrides: Partial<UserSummary> = {}): UserSummary => ({
  id: crypto.randomUUID(),
  username: "richard",
  displayName: null,
  avatarPublicId: null,
  bio: null,
  ...overrides,
});
