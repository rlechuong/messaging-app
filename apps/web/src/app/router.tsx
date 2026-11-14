import { createBrowserRouter } from "react-router";
import { GuestLayout } from "../features/auth/GuestLayout.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { ProtectedLayout } from "../features/auth/ProtectedLayout.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { ConversationPage } from "../features/conversations/ConversationPage.tsx";
import { ConversationsLayout } from "../features/conversations/ConversationsLayout.tsx";
import { NoConversationSelected } from "../features/conversations/NoConversationSelected.tsx";
import { ErrorPage } from "../pages/ErrorPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          {
            element: <ConversationsLayout />,
            children: [
              { index: true, element: <NoConversationSelected /> },
              { path: "conversations/:conversationId", element: <ConversationPage /> },
            ],
          },
        ],
      },
      {
        element: <GuestLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
