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

  it("supports reusable visual variants", () => {
    render(<Button variant="outline">Continue</Button>);

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
      "border-line",
    );
  });
});
