import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/HomePage.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
