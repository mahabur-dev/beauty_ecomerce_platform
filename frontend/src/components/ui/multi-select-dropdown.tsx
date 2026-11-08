"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

export interface MultiSelectOption {
  readonly value: string;
  readonly label: string;
  readonly group?: string;
  readonly count?: number;
}

export interface MultiSelectDropdownProps {
  readonly values: readonly string[];
  readonly onChange: (values: string[]) => void;
  readonly options: readonly MultiSelectOption[];
  readonly name?: string;
  readonly id?: string;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly "aria-label"?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function MultiSelectDropdown({
  values,
  onChange,
  options,
  name,
  id,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  const selectedSet = useMemo(() => new Set(values), [values]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.group && opt.group.toLowerCase().includes(query)),
    );
  }, [options, searchQuery]);

  function handleToggle(value: string) {
    if (selectedSet.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  function closeDropdown() {
    setIsOpen(false);
    setSearchQuery("");
  }

  function handleSelectAll() {
    const allFilteredValues = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...values, ...allFilteredValues]));
    onChange(combined);
  }

  function handleClearAll(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    onChange([]);
  }

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && options.length > 5) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, options.length]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedCount = values.length;
  const accessibleLabel =
    ariaLabel ??
    (selectedCount === 0
      ? placeholder
      : selectedCount === 1
        ? (options.find((o) => o.value === values[0])?.label ?? values[0])
        : `${selectedCount} selected`);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden inputs for form serialization */}
      {name &&
        values.map((val) => (
          <input key={val} type="hidden" name={name} value={val} />
        ))}

      <button
        type="button"
        id={id}
        aria-label={accessibleLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : setIsOpen(true))}
        className={cn(
          "relative flex h-11 w-full items-center justify-between rounded-xl border border-line bg-surface-elevated px-3.5 text-left text-sm text-ink shadow-2xs transition-all duration-200",
          selectedCount > 0 ? "pr-16" : "pr-10",
          "hover:border-brand-300 hover:bg-brand-50/30",
          "focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "border-brand-500 ring-4 ring-brand-100",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {selectedCount === 0 ? (
            <span className="truncate text-ink-muted">{placeholder}</span>
          ) : selectedCount === 1 ? (
            <span className="truncate font-medium text-ink">
              {options.find((o) => o.value === values[0])?.label ?? values[0]}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-brand-700">
                {selectedCount} selected
              </span>
              <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                {selectedCount}
              </span>
            </div>
          )}
        </div>

        {/* Clear button when items are selected */}
        {selectedCount > 0 ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear selection"
            onClick={handleClearAll}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClearAll();
              }
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted transition hover:bg-brand-100 hover:text-ink focus:outline-none"
          >
            <X className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}

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
          aria-multiselectable="true"
          aria-label={accessibleLabel}
          className="absolute left-0 z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-2xl border border-brand-100 bg-surface-elevated shadow-xl transition-all duration-150 animate-in fade-in-0 zoom-in-95"
        >
          {options.length > 5 ? (
            <div className="border-b border-brand-100/80 p-2.5">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 size-4 text-ink-muted" />
                <input
                  ref={searchInputRef}
                  id={searchInputId}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-lg border border-line bg-brand-50/40 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-muted focus:border-brand-500 focus:bg-surface-elevated focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          ) : null}

          {/* Quick actions: Select all / Clear all */}
          <div className="flex items-center justify-between border-b border-brand-100/60 bg-brand-50/30 px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-medium text-brand-700 transition hover:text-brand-900"
            >
              Select all
            </button>
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={() => handleClearAll()}
                className="font-medium text-ink-muted transition hover:text-red-600"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-muted">
                No matching options
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-brand-50/80 font-medium text-brand-900"
                        : "text-ink hover:bg-brand-50/50 hover:text-brand-900",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-line bg-surface-elevated",
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-3 stroke-[3]" />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {option.group ? (
                          <span className="block truncate text-[11px] text-ink-muted">
                            {option.group}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {typeof option.count === "number" ? (
                      <span className="text-xs text-ink-muted">
                        ({option.count})
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
