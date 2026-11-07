import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "@/app/dashboard/page";

/** Guard against accidentally presenting illustrative fixtures as real business data. */
describe("GlowCare dashboard preview", () => {
  it("labels illustrative data clearly and renders the approved dashboard sections", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sample metrics");
    for (const section of [
      "Total revenue",
      "Traffic sources",
      "Top selling items",
      "Weekly performance",
      "Recent orders",
      "Top categories",
    ]) {
      expect(screen.getByRole("region", { name: section })).toBeInTheDocument();
    }
  });
});
