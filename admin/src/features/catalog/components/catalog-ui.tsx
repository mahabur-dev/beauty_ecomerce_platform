"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import {
  SelectDropdown,
  type SelectOption,
} from "@/components/ui/select-dropdown";

export { SelectDropdown, type SelectOption };

export function PageHeading({
  eyebrow = "CATALOG MANAGEMENT",
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <div className="heading-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="catalog-heading-action">{action}</div>
      </div>
      {children}
    </>
  );
}
export function DemoNote() {
  return null;
}
export function CatalogTabs({
  active,
}: {
  active: "products" | "categories" | "subcategories";
}) {
  return (
    <nav className="catalog-tabs" aria-label="Catalog sections">
      {(["products", "categories", "subcategories"] as const).map((item) => (
        <Link
          prefetch
          key={item}
          href={`/dashboard/${item}`}
          aria-current={active === item ? "page" : undefined}
          className={
            active === item ? "catalog-tab catalog-tab-active" : "catalog-tab"
          }
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </Link>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="catalog-panel">
      <div className="catalog-panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function StatCard({
  label,
  value,
  detail,
  tone = "pink",
  icon = "package",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "pink" | "purple" | "green" | "orange";
  icon?: "package" | "layers" | "tag" | "warning";
}) {
  return (
    <div className="catalog-stat">
      <div className={`catalog-stat-icon catalog-tone-${tone}`}>
        <Icon name={icon} size={19} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return (
    <span className={`catalog-status catalog-status-${normalized}`}>
      <span />
      {label}
    </span>
  );
}
export function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`catalog-button catalog-button-${variant}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="catalog-row-action"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div
      className="catalog-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Scrollable catalog table"
    >
      {children}
    </div>
  );
}
export function TableEmpty({
  label = "No matching records",
  description = "Try another search or change your filters.",
}: {
  label?: string;
  description?: string;
}) {
  return (
    <div className="catalog-empty">
      <span className="catalog-empty-symbol">⌕</span>
      <strong>{label}</strong>
      <p>{description}</p>
    </div>
  );
}
export function ListToolbar({
  search,
  setSearch,
  status,
  setStatus,
  placeholder,
  statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "inactive", label: "Inactive" },
  ],
  children,
}: {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  placeholder: string;
  statusOptions?: readonly SelectOption[];
  children?: ReactNode;
}) {
  return (
    <div className="catalog-toolbar">
      <label className="catalog-search">
        <Icon name="search" size={17} />
        <span className="sr-only">Search catalog</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
        />
        <kbd>⌕</kbd>
      </label>
      <div className="catalog-toolbar-filters">
        <SelectDropdown
          id="catalog-status"
          aria-label="Filter status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          menuHeader="Status"
        />
        {children}
      </div>
    </div>
  );
}
export function Pagination({
  count,
  page,
  onPageChange,
  size = 5,
}: {
  count: number;
  page: number;
  onPageChange: (value: number) => void;
  size?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(count / size));
  return (
    <div className="catalog-pagination">
      <span>
        Showing {count === 0 ? 0 : (page - 1) * size + 1}–
        {Math.min(page * size, count)} of {count} entries
      </span>
      <div>
        <button
          disabled={page <= 1}
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
export function useCatalogList<T>(
  items: T[],
  matcher: (item: T, search: string, status: string) => boolean,
  size = 5,
) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const matching = useMemo(
    () =>
      items.filter((item) =>
        matcher(item, search.toLowerCase().trim(), status),
      ),
    [items, matcher, search, status],
  );
  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(matching.length / size)),
  );
  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    status,
    setStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    page: safePage,
    setPage,
    matching,
    paged: matching.slice((safePage - 1) * size, safePage * size),
  };
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  size = "normal",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "normal" | "wide";
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const firstControl = dialog?.querySelector<HTMLElement>(
      "input:not([disabled]), select:not([disabled]), button",
    );
    (firstControl ?? dialog)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab" && dialog) {
        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
          ),
        ).filter((el) => el.getClientRects().length > 0);
        if (!controls.length) return;
        const first = controls[0]!;
        const last = controls[controls.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      previouslyFocused?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="catalog-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`catalog-modal catalog-modal-${size}`}
      >
        <div className="catalog-modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="catalog-close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="catalog-modal-body">{children}</div>
      </section>
    </div>
  );
}
export function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
  pending = false,
  error,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  error?: string | undefined;
}) {
  return (
    <Modal
      title="Delete this item?"
      subtitle="This action cannot be undone."
      onClose={onCancel}
    >
      <div className="catalog-confirm">
        <span className="catalog-confirm-icon">!</span>
        <p>
          Are you sure you want to remove <strong>{name}</strong>? This action
          cannot be undone.
        </p>
      </div>
      {error && (
        <p className="catalog-field-error" role="alert">
          {error}
        </p>
      )}
      <div className="catalog-form-footer">
        <ActionButton variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </ActionButton>
        <ActionButton variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? "Deleting…" : "Delete item"}
        </ActionButton>
      </div>
    </Modal>
  );
}
export function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="catalog-field">
      <label className="catalog-field-label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <p className="catalog-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function CategoryAvatar({
  emoji,
  variant = "small",
}: {
  emoji: string;
  variant?: "small" | "large";
}) {
  return (
    <span
      className={`catalog-product-avatar catalog-product-avatar-${variant}`}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
