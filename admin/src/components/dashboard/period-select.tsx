"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

export type DashboardPeriod = "weekly" | "monthly" | "yearly";

export interface PeriodOption {
  readonly value: DashboardPeriod;
  readonly label: string;
  readonly description?: string;
}

export const DEFAULT_PERIOD_OPTIONS: readonly PeriodOption[] = [
  { value: "weekly", label: "Weekly", description: "Last 7 days" },
  { value: "monthly", label: "Monthly", description: "Last 30 days" },
  { value: "yearly", label: "Yearly", description: "Last 12 months" },
] as const;

export interface PeriodSelectProps {
  readonly value?: DashboardPeriod;
  readonly defaultValue?: DashboardPeriod;
  readonly onChange?: (period: DashboardPeriod) => void;
  readonly options?: readonly PeriodOption[];
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
}

/**
 * Enterprise-grade reporting period dropdown selector.
 * Features custom popover styling, crisp typography, keyboard navigation,
 * click-outside dismissal, and maintains an accessible synchronized select
 * for screen readers and automated test suites.
 */
export function PeriodSelect({
  value,
  defaultValue = "weekly",
  onChange,
  options = DEFAULT_PERIOD_OPTIONS,
  className = "",
  id = "dashboard-period-select",
  "aria-label": ariaLabel = "Select reporting period",
}: PeriodSelectProps) {
  const [internalValue, setInternalValue] =
    useState<DashboardPeriod>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = value ?? internalValue;
  const selectedOption =
    options.find((opt) => opt.value === currentValue) ?? options[0]!;

  function handleSelect(newValue: DashboardPeriod) {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setIsOpen(false);
  }

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key dismissal
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`dashboard-period-wrapper ${className}`}>
      {/* Synchronized accessible select element */}
      <select
        id={id}
        aria-label={ariaLabel}
        value={currentValue}
        onChange={(e) => handleSelect(e.target.value as DashboardPeriod)}
        className="sr-only"
        tabIndex={-1}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Enterprise custom trigger button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}, current selection: ${selectedOption.label}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`dashboard-period-trigger ${isOpen ? "active" : ""}`}
      >
        <span className="dashboard-period-icon" aria-hidden="true">
          <Icon name="calendar" size={15} />
        </span>
        <span className="dashboard-period-label">{selectedOption.label}</span>
        <span
          className={`dashboard-period-chevron ${isOpen ? "open" : ""}`}
          aria-hidden="true"
        >
          <Icon name="chevron" size={12} />
        </span>
      </button>

      {/* Floating custom dropdown menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="dashboard-period-menu"
        >
          <div className="dashboard-period-menu-header" aria-hidden="true">
            Reporting Period
          </div>
          {options.map((option) => {
            const isSelected = option.value === currentValue;
            return (
              <button
                key={option.value}
                role="option"
                type="button"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`dashboard-period-option ${isSelected ? "selected" : ""}`}
              >
                <div className="dashboard-period-option-text">
                  <span className="dashboard-period-option-label">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="dashboard-period-option-desc">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span
                    className="dashboard-period-option-check"
                    aria-hidden="true"
                  >
                    <Icon name="check" size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
