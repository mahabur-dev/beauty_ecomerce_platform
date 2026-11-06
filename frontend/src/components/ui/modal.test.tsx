import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "@/components/ui/modal";

describe("Modal", () => {
  it("renders an accessible native dialog and requests close", () => {
    const onOpenChange = vi.fn();

    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Shopping bag"
        description="Review items before checkout."
      >
        Bag content
      </Modal>,
    );

    expect(
      screen.getByRole("dialog", { name: "Shopping bag" }),
    ).toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
