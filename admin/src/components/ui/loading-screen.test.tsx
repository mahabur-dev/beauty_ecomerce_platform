import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingScreen } from "./loading-screen";
import { Spinner } from "./spinner";

describe("LoadingScreen and Spinner UI components", () => {
  it("renders LoadingScreen with default message and branding", () => {
    render(<LoadingScreen />);

    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");

    expect(screen.getByText("GlowCare")).toBeInTheDocument();
    expect(screen.getByText("Admin Console")).toBeInTheDocument();
    expect(
      screen.getByText("Checking administrator session…"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Verifying security credentials and access permissions.",
      ),
    ).toBeInTheDocument();
  });

  it("renders LoadingScreen with custom message and description", () => {
    render(
      <LoadingScreen
        message="Refreshing product catalog…"
        description="Syncing latest inventory changes from warehouse."
        fullScreen={false}
      >
        <button type="button">Cancel</button>
      </LoadingScreen>,
    );

    expect(screen.getByText("Refreshing product catalog…")).toBeInTheDocument();
    expect(
      screen.getByText("Syncing latest inventory changes from warehouse."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders Spinner with role status and accessible label", () => {
    render(<Spinner size="lg" label="Saving updates…" />);

    const spinner = screen.getByRole("status", { name: "Saving updates…" });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("width", "36");
    expect(spinner).toHaveAttribute("height", "36");
  });
});
