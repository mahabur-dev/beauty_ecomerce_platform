"use client";

import Image from "next/image";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import {
  type Product,
  type CatalogStatus,
  useCatalogDemo,
} from "@/features/catalog/demo-store";
import {
  ActionButton,
  CatalogTabs,
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

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
const pictures = ["🍊", "🧴", "🌷", "💄", "🌹", "🎨", "🫧", "✨"];

function ProductForm({
  current,
  onClose,
  onSave,
}: {
  current: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const { categories, products } = useCatalogDemo();
  const parents = categories.filter((item) => item.parentId === null);
  const [name, setName] = useState(current?.name ?? "");
  const [sku, setSku] = useState(current?.sku ?? "");
  const [categoryId, setCategoryId] = useState(current?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    current?.subcategoryId ?? "",
  );
  const [description, setDescription] = useState(current?.description ?? "");
  const [price, setPrice] = useState(String(current?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(String(current?.oldPrice ?? ""));
  const [stock, setStock] = useState(String(current?.stock ?? ""));
  const [status, setStatus] = useState<CatalogStatus>(
    current?.status ?? "Draft",
  );
  const [featured, setFeatured] = useState(current?.featured ?? false);
  const [image, setImage] = useState(current?.image ?? "🧴");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const subcategories = categories.filter(
    (item) => item.parentId === categoryId,
  );
  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image file under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(price);
    const previous = Number(oldPrice || price);
    const quantity = Number(stock);
    if (!name.trim() || !sku.trim() || !categoryId || !subcategoryId) {
      setError(
        "Complete all required fields, including category and subcategory.",
      );
      return;
    }
    if (
      products.some(
        (item) =>
          item.sku.toLowerCase() === sku.toLowerCase().trim() &&
          item.id !== current?.id,
      )
    ) {
      setError("SKU must be unique.");
      return;
    }
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isFinite(previous) ||
      previous < amount ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError(
        "Prices must be valid, old price cannot be lower, and stock must be a whole number.",
      );
      return;
    }
    onSave({
      id: current?.id ?? `PRD-DEMO-${crypto.randomUUID().slice(0, 6)}`,
      name: name.trim(),
      sku: sku.trim(),
      categoryId,
      subcategoryId,
      price: amount,
      oldPrice: previous,
      stock: quantity,
      status,
      featured,
      image: imagePreview ?? image,
      description: description.trim(),
    });
    onClose();
  };
  return (
    <Modal
      title={current ? "Edit product" : "Add new product"}
      subtitle="Create a polished product listing for your beauty catalog."
      size="wide"
      onClose={onClose}
    >
      <form className="catalog-form" onSubmit={submit}>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>01</span>
            <div>
              <h3>Product information</h3>
              <p>The details customers see when browsing your store.</p>
            </div>
          </div>
          <div className="catalog-form-grid">
            <Field label="Product name" required>
              <input
                autoFocus
                maxLength={110}
                className="catalog-input"
                placeholder="e.g. Rose Glow Face Serum"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field label="SKU" required>
              <input
                maxLength={40}
                className="catalog-input"
                placeholder="GC-SRM-008"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                required
              />
            </Field>
            <Field label="Category" required>
              <select
                className="catalog-input"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setSubcategoryId("");
                }}
                required
              >
                <option value="">Select category</option>
                {parents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory" required>
              <select
                className="catalog-input"
                disabled={!categoryId || subcategories.length === 0}
                value={subcategoryId}
                onChange={(event) => setSubcategoryId(event.target.value)}
                required
              >
                <option value="">Select subcategory</option>
                {subcategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="catalog-input catalog-textarea"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What makes this product special?"
            />
          </Field>
        </div>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>02</span>
            <div>
              <h3>Pricing & availability</h3>
              <p>Set display prices and preview inventory status.</p>
            </div>
          </div>
          <div className="catalog-form-grid catalog-form-grid-three">
            <Field label="Current price ($)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className="catalog-input"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </Field>
            <Field label="Compare at price ($)">
              <input
                type="number"
                min="0"
                step="0.01"
                className="catalog-input"
                placeholder="0.00"
                value={oldPrice}
                onChange={(event) => setOldPrice(event.target.value)}
              />
            </Field>
            <Field label="Stock units" required>
              <input
                type="number"
                min="0"
                step="1"
                className="catalog-input"
                placeholder="0"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </Field>
            <Field label="Publication status">
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
            <Field label="Store highlight">
              <label className="catalog-toggle-row">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                />
                <span>Featured product</span>
              </label>
            </Field>
          </div>
        </div>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>03</span>
            <div>
              <h3>Product imagery</h3>
              <p>Preview images locally; nothing is uploaded to a server.</p>
            </div>
          </div>
          <div className="catalog-image-editor">
            <div className="catalog-image-preview">
              {imagePreview || image.startsWith("data:") ? (
                <Image
                  unoptimized
                  width={125}
                  height={125}
                  src={imagePreview ?? image}
                  alt="Selected product preview"
                />
              ) : (
                <span>{image}</span>
              )}
            </div>
            <div className="catalog-image-controls">
              <label className="catalog-upload-control">
                <Icon name="package" size={17} /> Choose image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="sr-only"
                />
              </label>
              <small>JPG, PNG or WEBP · Max 5 MB · Local preview only</small>
              <div className="catalog-symbol-picker">
                {pictures.map((symbol) => (
                  <button
                    type="button"
                    key={symbol}
                    className={
                      symbol === image && !imagePreview
                        ? "catalog-symbol selected"
                        : "catalog-symbol"
                    }
                    aria-label={`Use ${symbol} illustration`}
                    aria-pressed={symbol === image && !imagePreview}
                    onClick={() => {
                      setImage(symbol);
                      setImagePreview(null);
                    }}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {error && (
          <p className="catalog-field-error" role="alert">
            {error}
          </p>
        )}
        <div className="catalog-form-footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton type="submit">
            {current ? "Save product" : "Add to catalog"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function ProductsPage() {
  const { products, categories, upsertProduct, removeProduct } =
    useCatalogDemo();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const matcher = useCallback(
    (item: Product, search: string, status: string) =>
      (status === "all" || item.status === status) &&
      (categoryFilter === "all" || item.categoryId === categoryFilter) &&
      `${item.name} ${item.sku} ${item.id}`.toLowerCase().includes(search),
    [categoryFilter],
  );
  const list = useCatalogList(products, matcher, 6);
  const liveCount = products.filter((item) => item.status === "Active").length;
  const lowStock = products.filter((item) => item.stock <= 15).length;
  const selectedCategory = useMemo(
    () => categories.filter((item) => item.parentId === null),
    [categories],
  );
  return (
    <PermissionGate permission="catalog.products.read">
      <div className="catalog-page">
        <PageHeading
          title="Products"
          description="Create, organize and manage your beauty product collection."
          action={
            <ActionButton onClick={() => setEditing("new")}>
              <span className="catalog-plus">+</span> Add new product
            </ActionButton>
          }
        />
        <DemoNote />
        <CatalogTabs active="products" />
        <div className="catalog-stats-grid">
          <StatCard
            label="Total products"
            value={products.length}
            detail="Available catalog records"
          />
          <StatCard
            label="Published"
            value={liveCount}
            detail="Visible in your storefront"
            icon="tag"
            tone="green"
          />
          <StatCard
            label="Draft & archived"
            value={products.length - liveCount}
            detail="Not publicly visible"
            icon="layers"
            tone="purple"
          />
          <StatCard
            label="Low / out of stock"
            value={lowStock}
            detail="Needs your attention"
            icon="warning"
            tone="orange"
          />
        </div>
        {notice && (
          <div role="status" className="catalog-inline-notice">
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
          title="Product catalog"
          subtitle="An organized overview of your current listings."
          action={
            <span className="catalog-count">
              {list.matching.length} products
            </span>
          }
        >
          <ListToolbar
            search={list.search}
            setSearch={list.setSearch}
            status={list.status}
            setStatus={list.setStatus}
            placeholder="Search by product name, SKU or ID..."
          >
            <label className="sr-only" htmlFor="catalog-filter-category">
              Filter category
            </label>
            <select
              id="catalog-filter-category"
              className="catalog-select"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                list.setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {selectedCategory.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </ListToolbar>
          <TableScroll>
            <table className="catalog-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
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
                        <span
                          className="catalog-product-avatar"
                          aria-hidden="true"
                        >
                          {item.image.startsWith("data:") ? (
                            <Image
                              unoptimized
                              width={44}
                              height={44}
                              src={item.image}
                              alt=""
                            />
                          ) : (
                            item.image
                          )}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {item.sku} · {item.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="catalog-category-name">
                        {categories.find((c) => c.id === item.categoryId)
                          ?.name ?? "—"}
                        <small>
                          {categories.find((c) => c.id === item.subcategoryId)
                            ?.name ?? "—"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="catalog-price">
                        <strong>{currency(item.price)}</strong>
                        <del>{currency(item.oldPrice)}</del>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`catalog-stock ${item.stock === 0 ? "catalog-stock-out" : item.stock <= 15 ? "catalog-stock-low" : ""}`}
                      >
                        {item.stock === 0
                          ? "Out of stock"
                          : `${item.stock} in stock`}
                      </span>
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
            <strong>Designed for growth.</strong> Product rows, filters, dialogs
            and data contracts can be wired to Laravel later without rebuilding
            the visual components.
          </span>
        </div>
      </div>
      {editing && (
        <ProductForm
          current={editing === "new" ? null : editing}
          onSave={upsertProduct}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            removeProduct(deleting.id);
            setDeleting(null);
            setNotice(`${deleting.name} removed from preview.`);
          }}
        />
      )}
    </PermissionGate>
  );
}
