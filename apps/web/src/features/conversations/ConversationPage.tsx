import { useParams } from "react-router";
import { ApiError } from "../../lib/api-client.ts";
import { useAuthenticatedUser } from "../auth/use-authenticated-user.ts";
import { getConversationTitle } from "./get-conversation-title.ts";
import { MessageList } from "./MessageList.tsx";
import { useConversations } from "./use-conversations.ts";
import { useMessages } from "./use-messages.ts";

export const ConversationPage = () => {
  const { conversationId } = useParams();
  if (!conversationId) throw new Error("Conversation ID is required");
  const currentUser = useAuthenticatedUser();

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const { data: conversations, isPending: isConversationsPending } = useConversations();
  const conversation = conversations?.find((conversation) => conversation.id === conversationId);

  if (isPending || isConversationsPending) return <p>Loading...</p>;
  if (isError) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return <p>Conversation not found.</p>;
    }

    return (
      <div role="alert">
        <p>Couldn't load conversation.</p>
        <button type="button" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {conversation && <h1>{getConversationTitle(conversation, currentUser.id)}</h1>}

      <MessageList
        pages={data.pages}
        members={conversation?.members ?? []}
        currentUserId={currentUser.id}
        onLoadOlder={() => void fetchNextPage()}
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
      />
    </div>
  );
};
