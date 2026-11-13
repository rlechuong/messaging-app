import type { Conversation, UserSummary } from "@messaging-app/shared";
import { describe, expect, it } from "vitest";
import { getConversationTitle } from "./get-conversation-title.ts";

const makeUser = (overrides: Partial<UserSummary> = {}): UserSummary => ({
  id: crypto.randomUUID(),
  username: "richard",
  displayName: null,
  avatarPublicId: null,
  bio: null,
  ...overrides,
});

const makeConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: crypto.randomUUID(),
  type: "DIRECT",
  name: null,
  lastMessageAt: null,
  members: [],
  latestMessage: null,
  ...overrides,
});

describe("getConversationTitle", () => {
  it("uses the conversation's name when it has one", () => {
    const user = makeUser();
    const conversation = makeConversation({ name: "Test Name" });

    expect(getConversationTitle(conversation, user.id)).toBe("Test Name");
  });

  it("uses the other member's display name, not the current user's name", () => {
    const user = makeUser();
    const otherUser = makeUser({ username: "thomas", displayName: "thomas9" });
    const conversation = makeConversation({ members: [user, otherUser] });

    expect(getConversationTitle(conversation, user.id)).toBe("thomas9");
  });

  it("falls back to the other member's username when there's no display name", () => {
    const user = makeUser();
    const otherUser = makeUser({ username: "thomas" });
    const conversation = makeConversation({ members: [user, otherUser] });

    expect(getConversationTitle(conversation, user.id)).toBe("thomas");
  });

  it(`returns "Deleted user" when the other member is gone`, () => {
    const user = makeUser();
    const conversation = makeConversation({ members: [user] });

    expect(getConversationTitle(conversation, user.id)).toBe("Deleted user");
  });
});
