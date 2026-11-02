import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/server.ts";
import { renderWithProviders } from "../../test/render.tsx";
import { LoginPage } from "./LoginPage.tsx";

describe("LoginPage", () => {
  it("shows the server's message when the credentials are wrong", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ error: { message: "Invalid email or password." } }, { status: 401 }),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByRole("textbox", { name: "Email" }), "richard@example.com");
    await user.type(screen.getByLabelText("Password"), "the art of war is weak");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
  });

  it("shows a connection error when the request fails", async () => {
    server.use(http.post("/api/auth/login", () => HttpResponse.error()));
    const { user } = renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByRole("textbox", { name: "Email" }), "richard@example.com");
    await user.type(screen.getByLabelText("Password"), "the art of war is weak");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't connect. Please try again.",
    );
  });
});
