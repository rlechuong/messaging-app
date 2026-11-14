import type { MessagesResponse, UserSummary } from "@messaging-app/shared";
import { getSenderName } from "./get-sender-name.ts";

type MessageListProps = {
  pages: MessagesResponse[];
  members: UserSummary[];
  currentUserId: string;
  onLoadOlder: () => void;
  hasOlder: boolean;
  isLoadingOlder: boolean;
};

export const MessageList = ({
  pages,
  members,
  currentUserId,
  onLoadOlder,
  hasOlder,
  isLoadingOlder,
}: MessageListProps) => {
  const messages = pages.flatMap((page) => page.messages).toReversed();

  if (messages.length === 0) {
    return <p>No messages yet.</p>;
  }

  return (
    <div>
      {hasOlder && (
        <button type="button" onClick={onLoadOlder} disabled={isLoadingOlder}>
          {isLoadingOlder ? "Loading..." : "Load older messages"}
        </button>
      )}

      <ol>
        {messages.map((message) => (
          <li key={message.id}>
            <p>{getSenderName(message.senderId, members, currentUserId)}</p>
            <p>{message.content}</p>
            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ol>
    </div>
  );
};
