"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

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
  readonly align?: "left" | "right";
  readonly fullWidth?: boolean;
}

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
  align = "left",
  fullWidth = true,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const accessibleLabel = ariaLabel ?? displayLabel;

  function handleSelect(newValue: T) {
    onChange(newValue);
    setIsOpen(false);
  }

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
    <div
      ref={containerRef}
      className={cn("relative", fullWidth ? "w-full" : "inline-block")}
    >
      {/* Hidden input for standard HTML form serialization */}
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        id={id}
        aria-label={accessibleLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex h-11 w-full items-center justify-between rounded-xl border border-line bg-surface-elevated px-3.5 pr-10 text-left text-sm text-ink shadow-2xs transition-all duration-200",
          "hover:border-brand-300 hover:bg-brand-50/30",
          "focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "border-brand-500 ring-4 ring-brand-100",
          className,
        )}
      >
        <span className="line-clamp-1 flex items-center gap-2 font-medium">
          {selectedOption?.icon}
          <span
            className={cn(
              !selectedOption && "text-ink-muted font-normal",
            )}
          >
            {displayLabel}
          </span>
        </span>

        {/* Custom Chevron icon with generous right gap (never touches border curve) */}
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isOpen && "rotate-180 text-brand-600",
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={accessibleLabel}
          className={cn(
            "absolute z-50 mt-1.5 max-h-60 min-w-full overflow-y-auto rounded-2xl border border-brand-100 bg-surface-elevated p-1.5 shadow-xl transition-all duration-150 animate-in fade-in-0 zoom-in-95",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-brand-50 font-semibold text-brand-800"
                    : "text-ink hover:bg-brand-50/60 hover:text-brand-900",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {option.icon}
                  <div className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-xs text-ink-muted">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                </div>
                {isSelected ? (
                  <Check className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
