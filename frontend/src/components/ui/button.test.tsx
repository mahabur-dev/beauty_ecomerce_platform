import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders an accessible loading state", () => {
    render(<Button isLoading>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("supports reusable visual variants including brand-aligned danger styles", () => {
    render(
      <>
        <Button variant="outline">Continue</Button>
        <Button variant="danger">Sign out</Button>
        <Button variant="danger-outline">Remove</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
      "border-line",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toHaveClass(
      "bg-danger-600",
      "text-white",
    );
    expect(screen.getByRole("button", { name: "Remove" })).toHaveClass(
      "border-danger-200",
      "text-danger-700",
    );
  });

  it("replaces leftIcon cleanly when loading with custom loadingText", () => {
    const { rerender } = render(
      <Button leftIcon={<span data-testid="left-icon" />} loadingText="Working…">
        Sign out
      </Button>,
    );

    expect(screen.getByTestId("left-icon")).toBeInTheDocument();

    rerender(
      <Button
        leftIcon={<span data-testid="left-icon" />}
        loadingText="Working…"
        isLoading
      >
        Sign out
      </Button>,
    );

    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();
  });
});
