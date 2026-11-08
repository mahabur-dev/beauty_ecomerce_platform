"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import {
  createCategory,
  deleteCategory,
  slugify,
  updateCategory,
  type CategoryInput,
} from "@/features/catalog/api";
import type { Category, CategoryStatus } from "@/features/catalog/contracts";
import { catalogErrorMessage } from "@/features/catalog/errors";
import {
  invalidateCategoryCatalog,
  useCatalogOptions,
  useCatalogSummary,
  useCategories,
  useDebouncedValue,
} from "@/features/catalog/queries";
import {
  ActionButton,
  CategoryAvatar,
  ConfirmDelete,
  DismissibleNotice,
  Field,
  IconAction,
  ListToolbar,
  Modal,
  PageHeading,
  Pagination,
  Panel,
  SelectDropdown,
  StatCard,
  StatusBadge,
  TableEmpty,
  TableScroll,
} from "./catalog-ui";

const PAGE_SIZE = 6;
const categoryStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
const glyphs = ["🧴", "💄", "🌸", "🫧", "🌿", "✨", "🎨", "💧", "🌹"];

function categoryGlyph(category: Pick<Category, "id">): string {
  return glyphs[category.id % glyphs.length] ?? "✨";
}

function CategoryForm({
  current,
  parentMode,
  categories,
  isSaving,
  requestError,
  onClose,
  onSave,
}: {
  current: Category | null;
  parentMode: boolean;
  categories: Category[];
  isSaving: boolean;
  requestError: string;
  onClose: () => void;
  onSave: (input: CategoryInput) => void;
}) {
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [parentId, setParentId] = useState(
    current?.parent_id
      ? String(current.parent_id)
      : String(categories[0]?.id ?? ""),
  );
  const [description, setDescription] = useState(current?.description ?? "");
  const [status, setStatus] = useState<CategoryStatus>(
    current?.status ?? "active",
  );
  const [validationError, setValidationError] = useState("");
  const title = parentMode ? "category" : "subcategory";

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedSlug = slugify(slug || name);
    if (!name.trim() || !normalizedSlug) {
      setValidationError("Enter a valid name and URL slug.");
      return;
    }
    if (!parentMode && !parentId) {
      setValidationError("Choose an active parent category.");
      return;
    }
    setValidationError("");
    onSave({
      name: name.trim(),
      slug: normalizedSlug,
      description: description.trim() || null,
      status,
      ...(parentMode || (current && current.parent_id === Number(parentId))
        ? {}
        : { category_id: Number(parentId) }),
    });
  }

  return (
    <Modal
      title={current ? `Edit ${title}` : `Add new ${title}`}
      subtitle="Define how customers discover products in your store."
      onClose={onClose}
    >
      <form onSubmit={submit} className="catalog-form" noValidate>
        <div className="catalog-form-grid">
          <Field label="Name" required>
            <input
              className="catalog-input"
              value={name}
              maxLength={160}
              onChange={(event) => {
                setName(event.target.value);
                if (!current) setSlug(slugify(event.target.value));
                setValidationError("");
              }}
              placeholder="e.g. Skin Care"
              required
              autoFocus
            />
          </Field>
          <Field label="URL slug" required>
            <input
              className="catalog-input"
              value={slug}
              maxLength={180}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="skin-care"
              required
            />
          </Field>
          {!parentMode && (
            <Field label="Parent category" required>
              <SelectDropdown
                id="category-parent"
                aria-label="Parent category"
                fullWidth
                value={parentId}
                onChange={setParentId}
                placeholder="Select parent"
                options={categories.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                menuHeader="Parent category"
              />
            </Field>
          )}
          <Field label="Visibility">
            <SelectDropdown
              id="category-status"
              aria-label="Visibility status"
              fullWidth
              value={status}
              onChange={(value) => setStatus(value as CategoryStatus)}
              options={categoryStatusOptions.filter(
                (option) => option.value !== "all",
              )}
              menuHeader="Visibility"
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className="catalog-input catalog-textarea"
            rows={3}
            maxLength={10000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description for this collection"
          />
        </Field>
        {(validationError || requestError) && (
          <DismissibleNotice
            variant="error"
            message={validationError || requestError}
          />
        )}
        <div className="catalog-form-footer">
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </ActionButton>
          <ActionButton type="submit" disabled={isSaving}>
            {isSaving
              ? "Saving…"
              : current
                ? "Save changes"
                : `Create ${title}`}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}

export function CategoryDetailModal({
  category,
  isParent,
  onClose,
  onEdit,
}: {
  category: Category;
  isParent: boolean;
  onClose: () => void;
  onEdit?: () => void;
}) {
  return (
    <Modal
      title={isParent ? "Category details" : "Subcategory details"}
      subtitle={`Detailed overview for ${category.name}`}
      onClose={onClose}
    >
      <div className="catalog-detail-container">
        <div className="catalog-detail-header">
          <div className="catalog-detail-avatar">
            <span>{categoryGlyph(category)}</span>
          </div>
          <h3 className="catalog-detail-title">{category.name}</h3>
          <div className="catalog-detail-header-meta-row">
            <StatusBadge value={category.status} />
            <span className="catalog-slug">/{category.slug}</span>
          </div>
        </div>

        <div className="catalog-detail-meta">
          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Classification</span>
            <span className="catalog-detail-value">
              {isParent ? "Primary Category" : "Subcategory"}
            </span>
          </div>

          {!isParent && (
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Parent category</span>
              <span className="catalog-detail-value">
                {category.parent?.name ?? "None"}
              </span>
            </div>
          )}

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">
              {isParent ? "Subcategories" : "Products represented"}
            </span>
            <span className="catalog-detail-value">
              {isParent
                ? `${category.children_count ?? category.children?.length ?? 0} collections`
                : `${category.products_count ?? 0} products`}
            </span>
          </div>

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Sort order</span>
            <span className="catalog-detail-value">{category.sort_order}</span>
          </div>

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Record ID</span>
            <span className="catalog-detail-value">
              <code className="catalog-detail-code">#{category.id}</code>
            </span>
          </div>

          {category.created_at && (
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Created date</span>
              <span className="catalog-detail-value">
                {new Date(category.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="catalog-detail-section">
          <span className="catalog-detail-section-title">Description</span>
          {category.description ? (
            <p className="catalog-detail-desc">{category.description}</p>
          ) : (
            <p className="catalog-detail-desc-empty">
              No description provided for this collection.
            </p>
          )}
        </div>

        <div className="catalog-detail-footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          {onEdit && (
            <ActionButton variant="primary" onClick={onEdit}>
              Edit {isParent ? "category" : "subcategory"}
            </ActionButton>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function CategoryManagement({
  mode,
}: {
  mode: "categories" | "subcategories";
}) {
  const queryClient = useQueryClient();
  const isParent = mode === "categories";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [viewing, setViewing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const recordsQuery = useCategories(mode, {
    page,
    perPage: PAGE_SIZE,
    search: debouncedSearch,
    status,
  });
  const summaryQuery = useCatalogSummary();
  const optionsQuery = useCatalogOptions();
  const records = recordsQuery.data?.data ?? [];
  const meta = recordsQuery.data?.meta;
  const parents = optionsQuery.data?.categories ?? [];
  const summary = summaryQuery.data?.[mode];
  const pageError =
    recordsQuery.error ?? summaryQuery.error ?? optionsQuery.error;
  const formParents =
    editing &&
    editing !== "new" &&
    editing.parent &&
    !parents.some((item) => item.id === editing.parent?.id)
      ? [...parents, editing.parent]
      : parents;

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) => {
      return editing && editing !== "new"
        ? updateCategory(mode, editing.id, input)
        : createCategory(mode, input);
    },
    onSuccess: async (saved) => {
      await invalidateCategoryCatalog(queryClient);
      setEditing(null);
      setNotice(
        `${saved.name} has been ${editing === "new" ? "created" : "updated"}.`,
      );
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (record: Category) => deleteCategory(mode, record.id),
    onSuccess: async (_, record) => {
      await invalidateCategoryCatalog(queryClient);
      setDeleting(null);
      setNotice(`${record.name} has been deleted.`);
    },
  });

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function updateStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <PermissionGate permission="catalog.categories.read">
      <div className="catalog-page">
        <PageHeading
          title={isParent ? "Categories" : "Subcategories"}
          description={
            isParent
              ? "Organize your store into beautiful, easy-to-browse collections."
              : "Manage the product groups within each main category."
          }
          action={
            <ActionButton
              onClick={() => setEditing("new")}
              disabled={!isParent && !parents.length}
            >
              <span className="catalog-plus">+</span> Add{" "}
              {isParent ? "category" : "subcategory"}
            </ActionButton>
          }
        />
        <div className="catalog-stats-grid">
          <StatCard
            label={`Total ${mode}`}
            value={summary?.total ?? "—"}
            detail="All catalog records"
            icon="layers"
          />
          <StatCard
            label="Active collections"
            value={summary?.active ?? "—"}
            detail="Visible in the storefront"
            icon="tag"
            tone="green"
          />
          <StatCard
            label="Inactive collections"
            value={summary?.inactive ?? "—"}
            detail="Hidden from customers"
            icon="layers"
            tone="purple"
          />
          <StatCard
            label={isParent ? "Active hierarchy" : "Products represented"}
            value={
              isParent
                ? parents.length
                : records.reduce(
                    (sum, item) => sum + (item.products_count ?? 0),
                    0,
                  )
            }
            detail={
              isParent ? "Available parent categories" : "On this results page"
            }
            icon="package"
            tone="orange"
          />
        </div>
        {notice && (
          <DismissibleNotice
            variant="success"
            message={notice}
            onDismiss={() => setNotice("")}
          />
        )}
        {pageError && (
          <DismissibleNotice
            variant="error"
            message={catalogErrorMessage(pageError)}
          />
        )}
        <Panel
          title={`${isParent ? "Category" : "Subcategory"} directory`}
          subtitle="Manage visibility, hierarchy, and category presentation."
          action={
            <span className="catalog-count">
              {meta?.total ?? 0} collections
            </span>
          }
        >
          <ListToolbar
            search={search}
            setSearch={updateSearch}
            status={status}
            setStatus={updateStatus}
            statusOptions={categoryStatusOptions}
            placeholder={`Search ${mode}...`}
          />
          <TableScroll>
            <table
              className="catalog-table"
              aria-busy={recordsQuery.isFetching}
            >
              <thead>
                <tr>
                  <th scope="col">{isParent ? "Category" : "Subcategory"}</th>
                  {!isParent && <th scope="col">Parent category</th>}
                  <th scope="col">Slug</th>
                  <th scope="col">{isParent ? "Subcategories" : "Products"}</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="catalog-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="catalog-name-cell">
                        <CategoryAvatar emoji={categoryGlyph(item)} />
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.description || "No description"}</small>
                        </div>
                      </div>
                    </td>
                    {!isParent && <td>{item.parent?.name ?? "—"}</td>}
                    <td>
                      <code className="catalog-slug">/{item.slug}</code>
                    </td>
                    <td>
                      <span className="catalog-count">
                        {isParent
                          ? (item.children_count ?? 0)
                          : (item.products_count ?? 0)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                    <td>
                      <div className="catalog-actions">
                        <IconAction
                          label={`View details for ${item.name}`}
                          onClick={() => setViewing(item)}
                        >
                          <Icon name="eye" size={15} />
                        </IconAction>
                        <IconAction
                          label={`Edit ${item.name}`}
                          onClick={() => setEditing(item)}
                        >
                          <span aria-hidden="true">✎</span>
                        </IconAction>
                        <IconAction
                          label={`Delete ${item.name}`}
                          onClick={() => setDeleting(item)}
                        >
                          <span aria-hidden="true">♧</span>
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          {!recordsQuery.isLoading && !records.length && <TableEmpty />}
          <Pagination
            count={meta?.total ?? 0}
            page={meta?.current_page ?? page}
            onPageChange={setPage}
            size={PAGE_SIZE}
          />
        </Panel>
      </div>
      {viewing && (
        <CategoryDetailModal
          category={viewing}
          isParent={isParent}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const target = viewing;
            setViewing(null);
            setEditing(target);
          }}
        />
      )}
      {editing && (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          parentMode={isParent}
          current={editing === "new" ? null : editing}
          categories={formParents}
          isSaving={saveMutation.isPending}
          requestError={
            saveMutation.isError ? catalogErrorMessage(saveMutation.error) : ""
          }
          onSave={(input) => saveMutation.mutate(input)}
          onClose={() => {
            if (!saveMutation.isPending) {
              saveMutation.reset();
              setEditing(null);
            }
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          onConfirm={() => deleteMutation.mutate(deleting)}
          pending={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? catalogErrorMessage(deleteMutation.error)
              : undefined
          }
          onCancel={() => {
            if (!deleteMutation.isPending) {
              deleteMutation.reset();
              setDeleting(null);
            }
          }}
        />
      )}
    </PermissionGate>
  );
}
