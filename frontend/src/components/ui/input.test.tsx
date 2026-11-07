import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("connects labels and validation messages accessibly", () => {
    render(
      <Input
        label="Email address"
        type="email"
        error="Enter a valid email address"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address");
  });
});
