"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import {
  type Category,
  type CatalogStatus,
  slugify,
  useCatalogDemo,
} from "@/features/catalog/demo-store";
import {
  ActionButton,
  CatalogTabs,
  CategoryAvatar,
  ConfirmDelete,
  DemoNote,
  Field,
  IconAction,
  ListToolbar,
  Modal,
  PageHeading,
  Pagination,
  Panel,
  StatCard,
  StatusBadge,
  TableEmpty,
  TableScroll,
  useCatalogList,
} from "./catalog-ui";

const symbols = ["🧴", "💄", "🌸", "🫧", "🌿", "✨", "🎨", "💧", "🌹"];
function CategoryForm({
  current,
  parentMode,
  onClose,
  onSave,
  categories,
}: {
  current: Category | null;
  parentMode: boolean;
  onClose: () => void;
  onSave: (value: Category) => void;
  categories: Category[];
}) {
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [parentId, setParentId] = useState(
    current?.parentId ??
      (parentMode
        ? ""
        : (categories.find((item) => item.parentId === null)?.id ?? "")),
  );
  const [description, setDescription] = useState(current?.description ?? "");
  const [status, setStatus] = useState<CatalogStatus>(
    current?.status ?? "Active",
  );
  const [image, setImage] = useState(current?.image ?? "🧴");
  const [error, setError] = useState("");
  const title = parentMode ? "category" : "subcategory";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextSlug = slugify(slug || name);
    if (!name.trim() || !nextSlug) {
      setError("Enter a valid name and slug.");
      return;
    }
    if (!parentMode && !parentId) {
      setError("Choose a parent category.");
      return;
    }
    if (
      categories.some(
        (item) =>
          item.id !== current?.id &&
          item.slug === nextSlug &&
          item.parentId === (parentMode ? null : parentId),
      )
    ) {
      setError("This slug is already used under the same parent.");
      return;
    }
    onSave({
      id: current?.id ?? `cat-demo-${crypto.randomUUID()}`,
      name: name.trim(),
      slug: nextSlug,
      parentId: parentMode ? null : parentId,
      description: description.trim(),
      status,
      image,
      productCount: current?.productCount ?? 0,
    });
    onClose();
  };
  return (
    <Modal
      title={current ? `Edit ${title}` : `Add new ${title}`}
      subtitle="Define how customers discover products in your store."
      onClose={onClose}
    >
      <form onSubmit={submit} className="catalog-form">
        <div className="catalog-form-grid">
          <Field label="Name" required>
            <input
              className="catalog-input"
              value={name}
              maxLength={90}
              onChange={(event) => {
                setName(event.target.value);
                if (!current) setSlug(slugify(event.target.value));
                setError("");
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
              onChange={(event) => setSlug(event.target.value)}
              placeholder="skin-care"
              required
            />
          </Field>
          {!parentMode && (
            <Field label="Parent category" required>
              <select
                className="catalog-input"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                required
              >
                <option value="">Select parent</option>
                {categories
                  .filter((item) => item.parentId === null)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <Field label="Visibility">
            <select
              className="catalog-input"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CatalogStatus)
              }
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className="catalog-input catalog-textarea"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description for this collection"
          />
        </Field>
        <Field
          label="Category icon"
          hint="Visual placeholder icons; image library can be connected later."
        >
          <div className="catalog-symbol-picker">
            {symbols.map((symbol) => (
              <button
                aria-label={`Choose ${symbol} icon`}
                aria-pressed={image === symbol}
                type="button"
                className={
                  image === symbol
                    ? "catalog-symbol selected"
                    : "catalog-symbol"
                }
                onClick={() => setImage(symbol)}
                key={symbol}
              >
                {symbol}
              </button>
            ))}
          </div>
        </Field>
        {error && (
          <div className="catalog-field-error" role="alert">
            {error}
          </div>
        )}
        <div className="catalog-form-footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton type="submit">
            {current ? "Save changes" : `Create ${title}`}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function CategoryManagement({
  mode,
}: {
  mode: "categories" | "subcategories";
}) {
  const { categories, products, upsertCategory, removeCategory } =
    useCatalogDemo();
  const isParent = mode === "categories";
  const records = useMemo(
    () =>
      categories.filter((item) =>
        isParent ? item.parentId === null : item.parentId !== null,
      ),
    [categories, isParent],
  );
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const matcher = useCallback(
    (item: Category, search: string, status: string) =>
      (status === "all" || item.status === status) &&
      `${item.name} ${item.slug} ${item.description}`
        .toLowerCase()
        .includes(search),
    [],
  );
  const list = useCatalogList(records, matcher, 6);
  const remove = () => {
    if (!deleting) return;
    const ok = removeCategory(deleting.id);
    setNotice(
      ok
        ? `${deleting.name} removed from preview.`
        : "This category contains subcategories or products. Remove those first.",
    );
    setDeleting(null);
  };
  const active = records.filter((item) => item.status === "Active").length;
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
            <ActionButton onClick={() => setEditing("new")}>
              <span className="catalog-plus">+</span> Add{" "}
              {isParent ? "category" : "subcategory"}
            </ActionButton>
          }
        />
        <DemoNote />
        <CatalogTabs active={mode} />
        <div className="catalog-stats-grid">
          <StatCard
            label={`Total ${mode}`}
            value={records.length}
            detail="Across your preview catalog"
            icon="layers"
          />
          <StatCard
            label="Active collections"
            value={active}
            detail="Visible in the storefront"
            icon="tag"
            tone="green"
          />
          <StatCard
            label="Draft collections"
            value={records.length - active}
            detail="Pending publication"
            icon="layers"
            tone="purple"
          />
          <StatCard
            label="Products represented"
            value={
              isParent
                ? products.length
                : products.filter((product) =>
                    records.some((item) => item.id === product.subcategoryId),
                  ).length
            }
            detail="Sample product records"
            icon="package"
            tone="orange"
          />
        </div>
        {notice && (
          <div className="catalog-inline-notice" role="status">
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notice"
            >
              ×
            </button>
          </div>
        )}
        <Panel
          title={`${isParent ? "Category" : "Subcategory"} directory`}
          subtitle="Manage visibility, hierarchy, and category presentation."
          action={
            <span className="catalog-count">
              {list.matching.length} collections
            </span>
          }
        >
          <ListToolbar
            search={list.search}
            setSearch={list.setSearch}
            status={list.status}
            setStatus={list.setStatus}
            placeholder={`Search ${mode}...`}
          >
            {!isParent && (
              <span className="catalog-filter-hint">Grouped by parent</span>
            )}
          </ListToolbar>
          <TableScroll>
            <table className="catalog-table">
              <thead>
                <tr>
                  <th scope="col">{isParent ? "Category" : "Subcategory"}</th>
                  {!isParent && <th scope="col">Parent category</th>}
                  <th scope="col">Slug</th>
                  <th scope="col">Products</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="catalog-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.paged.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="catalog-name-cell">
                        <CategoryAvatar emoji={item.image} />
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.description}</small>
                        </div>
                      </div>
                    </td>
                    {!isParent && (
                      <td>
                        {categories.find(
                          (category) => category.id === item.parentId,
                        )?.name ?? "—"}
                      </td>
                    )}
                    <td>
                      <code className="catalog-slug">/{item.slug}</code>
                    </td>
                    <td>
                      <span className="catalog-count">{item.productCount}</span>
                    </td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                    <td>
                      <div className="catalog-actions">
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
          {!list.matching.length && <TableEmpty />}
          <Pagination
            count={list.matching.length}
            page={list.page}
            onPageChange={list.setPage}
            size={6}
          />
        </Panel>
        <div className="catalog-tip">
          <Icon name="sparkles" size={20} />
          <span>
            <strong>Beautiful organization, simple management.</strong> This
            preview demonstrates independent category and subcategory
            experiences with one reusable hierarchy model.
          </span>
        </div>
      </div>
      {editing && (
        <CategoryForm
          parentMode={isParent}
          current={editing === "new" ? null : editing}
          categories={categories}
          onSave={upsertCategory}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </PermissionGate>
  );
}
