import { describe, expect, it } from "vitest";
import { makeUser } from "../../test/factories.ts";
import { getSenderName } from "./get-sender-name.ts";

describe("getSenderName", () => {
  it(`returns "You" for the current user's messages`, () => {
    const user = makeUser();

    expect(getSenderName(user.id, [user], user.id)).toBe("You");
  });

  it("returns the sender's display name when they have one", () => {
    const currentUser = makeUser();
    const otherUser = makeUser({ username: "thomas", displayName: "thomas9" });

    expect(getSenderName(otherUser.id, [currentUser, otherUser], currentUser.id)).toBe("thomas9");
  });

  it("returns the sender's username when they don't have a display name", () => {
    const currentUser = makeUser();
    const otherUser = makeUser({ username: "thomas" });

    expect(getSenderName(otherUser.id, [currentUser, otherUser], currentUser.id)).toBe("thomas");
  });

  it(`returns "Deleted user" for a null senderId`, () => {
    const currentUser = makeUser();

    expect(getSenderName(null, [currentUser], currentUser.id)).toBe("Deleted user");
  });

  it(`returns "Deleted user" for a sender who isn't in members`, () => {
    const currentUser = makeUser();
    const otherUser = makeUser({ username: "thomas", displayName: "thomas9" });

    expect(getSenderName(otherUser.id, [currentUser], currentUser.id)).toBe("Deleted user");
  });
});
