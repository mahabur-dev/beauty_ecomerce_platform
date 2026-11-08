"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
  readonly icon?: ReactNode;
}

export interface SelectDropdownProps<T extends string = string> {
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly options: readonly SelectOption<T>[];
  readonly id?: string;
  readonly name?: string;
  readonly placeholder?: string;
  readonly "aria-label"?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly menuHeader?: string;
  readonly icon?: IconName | ReactNode;
  readonly align?: "left" | "right";
  readonly fullWidth?: boolean;
}

/**
 * Enterprise-grade reusable dropdown selector matching the GlowCare Dashboard design.
 * Features a custom floating listbox popover, smooth chevron indicator, checkmark on selection,
 * click-outside and Escape key dismissal, and keeps an accessible hidden native select
 * for screen readers and automated test suites.
 */
export function SelectDropdown<T extends string = string>({
  value,
  onChange,
  options,
  id,
  name,
  placeholder = "Select an option",
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
  menuHeader,
  icon,
  align = "left",
  fullWidth = false,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const accessibleLabel = ariaLabel ?? placeholder;

  function handleSelect(newValue: T) {
    onChange(newValue);
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

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return <Icon name={icon as IconName} size={15} />;
    }
    return icon;
  };

  return (
    <div
      ref={containerRef}
      className={`select-dropdown-wrapper ${fullWidth ? "full-width" : ""} ${className}`}
    >
      {/* Synchronized accessible select element */}
      <select
        id={id}
        name={name}
        aria-label={accessibleLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => handleSelect(e.target.value as T)}
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
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${accessibleLabel}, current selection: ${displayLabel}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`select-dropdown-trigger ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
      >
        <div className="select-dropdown-trigger-content">
          {icon && (
            <span className="select-dropdown-icon" aria-hidden="true">
              {renderIcon()}
            </span>
          )}
          <span className="select-dropdown-label">{displayLabel}</span>
        </div>
        <span
          className={`select-dropdown-chevron ${isOpen ? "open" : ""}`}
          aria-hidden="true"
        >
          <Icon name="chevron" size={12} />
        </span>
      </button>

      {/* Floating custom dropdown menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={accessibleLabel}
          className={`select-dropdown-menu align-${align}`}
        >
          {menuHeader && (
            <div className="select-dropdown-menu-header" aria-hidden="true">
              {menuHeader}
            </div>
          )}
          <div className="select-dropdown-options-list">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  role="option"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`select-dropdown-option ${isSelected ? "selected" : ""}`}
                >
                  {option.icon && (
                    <span
                      className="select-dropdown-option-icon"
                      aria-hidden="true"
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="select-dropdown-option-text">
                    <span className="select-dropdown-option-label">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="select-dropdown-option-desc">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span
                      className="select-dropdown-option-check"
                      aria-hidden="true"
                    >
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
