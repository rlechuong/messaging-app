import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render.tsx";
import { server } from "../../test/server.ts";
import { RegisterPage } from "./RegisterPage.tsx";

describe("RegisterPage", () => {
  it("shows the error under the email field for a taken email", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json(
          {
            error: {
              message: "Email is already in use.",
              fieldErrors: { email: ["Email is already in use."] },
            },
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByRole("textbox", { name: "Email" }), "richard@example.com");
    await user.type(screen.getByRole("textbox", { name: "Username" }), "richard");
    await user.type(screen.getByLabelText("Password"), "the art of war is strong");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await screen.findByText("Email is already in use.");
    const emailInput = screen.getByRole("textbox", { name: "Email" });
    expect(emailInput).toHaveAccessibleDescription("Email is already in use.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
