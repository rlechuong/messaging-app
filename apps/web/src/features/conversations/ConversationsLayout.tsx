import { Outlet } from "react-router";
import { ConversationList } from "./ConversationList.tsx";

export const ConversationsLayout = () => {
  return (
    <div>
      <aside>
        <ConversationList />
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
};
