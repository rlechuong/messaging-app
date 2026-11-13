import { useParams } from "react-router";

export const ConversationPage = () => {
  const { conversationId } = useParams();

  return (
    <div>
      <p>Conversation {conversationId}</p>
    </div>
  );
};
