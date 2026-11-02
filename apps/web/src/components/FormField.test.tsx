import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField.tsx";

const registration = {
  name: "email",
  onChange: async () => {},
  onBlur: async () => {},
  ref: () => {},
};

describe("FormField", () => {
  it("connects the error message to the input", () => {
    render(
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error="Enter a valid email address."
        registration={registration}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address.");
  });

  it("does not mark the input invalid when there is no error", () => {
    render(
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={undefined}
        registration={registration}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAccessibleDescription();
  });
});
