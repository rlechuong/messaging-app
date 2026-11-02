import { createBrowserRouter } from "react-router";
import { GuestLayout } from "../features/auth/GuestLayout.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { ProtectedLayout } from "../features/auth/ProtectedLayout.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { HomePage } from "../pages/HomePage.tsx";
import { ErrorPage } from "../pages/ErrorPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [{ index: true, element: <HomePage /> }],
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
