import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { slugify } from "./api";
import {
  CatalogTabs,
  DismissibleNotice,
  Pagination,
  StatusBadge,
} from "./components/catalog-ui";

describe("catalog design foundation", () => {
  it("creates stable slugs and renders shared status UI", () => {
    expect(slugify("  Vitamin C & Glow  ")).toBe("vitamin-c-glow");
    render(<StatusBadge value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
  it("disables previous/next at pagination boundaries", () => {
    render(<Pagination count={3} page={1} onPageChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
  it("links all catalog tabs to distinct routes", () => {
    render(<CatalogTabs active="products" />);
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/dashboard/products",
    );
    expect(screen.getByRole("link", { name: "Subcategories" })).toHaveAttribute(
      "href",
      "/dashboard/subcategories",
    );
  });
});

describe("DismissibleNotice reusable enterprise component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders success notice with status role and auto-dismisses after 4 seconds", () => {
    const onDismiss = vi.fn();
    render(
      <DismissibleNotice
        message="Eyeliner new varient has been created."
        variant="success"
        onDismiss={onDismiss}
      />,
    );

    const alert = screen.getByRole("status");
    expect(alert).toHaveTextContent("Eyeliner new varient has been created.");
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance 3.9 seconds, still visible
    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance remaining 100ms (total 4000ms), auto-dismisses
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders error notice with alert role and can be dismissed immediately via close button", () => {
    const onDismiss = vi.fn();
    render(
      <DismissibleNotice
        message="Cloudinary credentials are not configured."
        variant="error"
        onDismiss={onDismiss}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Cloudinary credentials are not configured.",
    );

    const closeBtn = screen.getByRole("button", { name: "Dismiss notice" });
    fireEvent.click(closeBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("pauses auto-dismiss timer on mouse enter and resumes on mouse leave", () => {
    const onDismiss = vi.fn();
    render(
      <DismissibleNotice
        message="Item updated successfully."
        variant="success"
        onDismiss={onDismiss}
      />,
    );

    const alert = screen.getByRole("status");

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // Mouse enters (hover) -> pauses countdown
    fireEvent.mouseEnter(alert);

    // 5 seconds pass while user is reading (hovering)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Mouse leaves -> timer resumes remaining ~2s
    fireEvent.mouseLeave(alert);

    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

