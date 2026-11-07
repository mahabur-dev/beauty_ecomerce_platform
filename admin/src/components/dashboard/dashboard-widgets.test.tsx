import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "@/app/dashboard/page";

describe("GlowCare dashboard overview", () => {
  it("renders the dashboard heading, period selector, and all approved sections", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();

    const select = screen.getByRole("combobox", {
      name: /select reporting period/i,
    });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("weekly");

    fireEvent.change(select, { target: { value: "monthly" } });
    expect(select).toHaveValue("monthly");

    fireEvent.change(select, { target: { value: "yearly" } });
    expect(select).toHaveValue("yearly");

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

    for (const card of [
      "Reward points",
      "Return requests",
      "Low-stock items",
      "Cancelled orders",
    ]) {
      expect(screen.getByText(card)).toBeInTheDocument();
    }
  });

  it("opens custom dropdown and allows selecting an option via UI click", () => {
    render(<DashboardPage />);

    const trigger = screen.getByRole("button", {
      name: /select reporting period/i,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Weekly");

    // Open dropdown
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    // Select Monthly from custom menu
    const monthlyOption = within(listbox).getByRole("option", {
      name: /monthly/i,
    });
    fireEvent.click(monthlyOption);

    expect(trigger).toHaveTextContent("Monthly");
  });
});
