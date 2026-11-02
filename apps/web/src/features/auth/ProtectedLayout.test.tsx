import type { PublicUser } from "@messaging-app/shared";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderRoutes } from "../../test/render.tsx";
import { server } from "../../test/server.ts";
import { ProtectedLayout } from "./ProtectedLayout.tsx";

const routes = [
  {
    element: <ProtectedLayout />,
    children: [{ path: "/", element: <p>Protected content</p> }],
  },
  { path: "/login", element: <p>Login page</p> },
];

const testUser: PublicUser = {
  id: "7667dd23-7fa3-4e60-84a5-e51c96e8a462",
  email: "richard@example.com",
  username: "richard",
  displayName: null,
  avatarPublicId: null,
  bio: null,
};

describe("ProtectedLayout", () => {
  it("redirects a logged-out user to the login page", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ error: { message: "Not authenticated." } }, { status: 401 }),
      ),
    );

    renderRoutes(routes, { initialPath: "/" });

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows protected content to a logged-in user", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({
          user: testUser,
        }),
      ),
    );

    renderRoutes(routes, { initialPath: "/" });

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
