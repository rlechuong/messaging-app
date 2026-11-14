import { NavLink } from "react-router";
import { useConversations } from "./use-conversations.ts";
import { useAuthenticatedUser } from "../auth/use-authenticated-user.ts";
import { getConversationTitle } from "./get-conversation-title.ts";

export const ConversationList = () => {
  const { data: conversations, isPending, isError, refetch } = useConversations();
  const currentUser = useAuthenticatedUser();

  if (isPending) return <p>Loading...</p>;
  if (isError) {
    return (
      <div role="alert">
        <p>Couldn't load conversations.</p>
        <button type="button" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }
  if (conversations.length === 0) return <p>No conversations yet.</p>;

  return (
    <nav aria-label="Conversations">
      <ul>
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <NavLink to={`/conversations/${conversation.id}`}>
              <strong>{getConversationTitle(conversation, currentUser.id)}</strong>

              {conversation.lastMessageAt && (
                <time dateTime={conversation.lastMessageAt}>
                  {new Date(conversation.lastMessageAt).toLocaleString()}
                </time>
              )}
              <span>{conversation.latestMessage?.content ?? "No messages yet"}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
