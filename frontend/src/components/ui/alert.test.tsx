import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Alert, DEFAULT_ALERT_DISMISS_MS, DismissibleAlert } from "./alert";

describe("Alert & DismissibleAlert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("auto-dismisses success notices after 4 seconds and invokes onDismiss", () => {
    const onDismiss = vi.fn();

    render(
      <DismissibleAlert tone="success" onDismiss={onDismiss}>
        Your review has been updated and queued for moderation.
      </DismissibleAlert>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Your review has been updated and queued for moderation.",
    );

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ALERT_DISMISS_MS - 100);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("auto-dismisses error alerts and pauses countdown while hovered", () => {
    const onDismiss = vi.fn();

    render(
      <DismissibleAlert tone="error" onDismiss={onDismiss}>
        Failed to save review changes.
      </DismissibleAlert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Failed to save review changes.");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    fireEvent.mouseEnter(alert);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.mouseLeave(alert);
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports immediate manual dismissal and persistent non-expiring Alert mode", () => {
    const onDismiss = vi.fn();

    const { rerender } = render(
      <DismissibleAlert tone="info" onDismiss={onDismiss}>
        Transient notice
      </DismissibleAlert>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(
      <Alert tone="warning" durationMs={0} dismissible={false}>
        Persistent warning
      </Alert>,
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Persistent warning");
  });
});

