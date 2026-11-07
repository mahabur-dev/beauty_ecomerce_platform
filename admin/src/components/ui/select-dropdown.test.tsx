import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectDropdown } from "./select-dropdown";

describe("SelectDropdown reusable enterprise component", () => {
  const options = [
    { value: "all", label: "All statuses" },
    { value: "Active", label: "Active", description: "Currently visible" },
    { value: "Draft", label: "Draft" },
    { value: "Archived", label: "Archived" },
  ];

  it("renders trigger with initial value and keeps hidden select synchronized", () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        id="test-status"
        aria-label="Filter status"
        value="all"
        onChange={handleChange}
        options={options}
        menuHeader="Status"
      />,
    );

    // Synchronized accessible combobox for assistive technology & tests
    const combobox = screen.getByRole("combobox", { name: "Filter status" });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveValue("all");

    // Trigger button
    const trigger = screen.getByRole("button", {
      name: /filter status, current selection: all statuses/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it("opens popover menu when clicked and selects new option", () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        id="test-status"
        aria-label="Filter status"
        value="all"
        onChange={handleChange}
        options={options}
        menuHeader="Status"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /filter status, current selection: all statuses/i,
    });

    // Menu is closed initially
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Click trigger to open menu
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Click on Active option within popover menu
    const activeOption = within(listbox).getByRole("option", {
      name: /active/i,
    });
    fireEvent.click(activeOption);

    expect(handleChange).toHaveBeenCalledWith("Active");
  });

  it("supports programmatic change via synchronized native select", () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        id="test-status"
        aria-label="Filter status"
        value="all"
        onChange={handleChange}
        options={options}
      />,
    );

    const combobox = screen.getByRole("combobox", { name: "Filter status" });
    fireEvent.change(combobox, { target: { value: "Draft" } });

    expect(handleChange).toHaveBeenCalledWith("Draft");
  });

  it("closes popover when Escape key is pressed", () => {
    render(
      <SelectDropdown
        id="test-status"
        aria-label="Filter status"
        value="all"
        onChange={() => {}}
        options={options}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /filter status/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

