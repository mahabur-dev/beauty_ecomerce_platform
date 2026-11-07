"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import {
  createProduct,
  deleteProduct,
  setProductStatus,
  slugify,
  updateProduct,
  updateProductVariant,
  uploadProductImage,
  type ProductInput,
} from "@/features/catalog/api";
import type { Product, ProductStatus } from "@/features/catalog/contracts";
import { catalogErrorMessage } from "@/features/catalog/errors";
import {
  invalidateProductCatalog,
  useCatalogOptions,
  useCatalogSummary,
  useDebouncedValue,
  useProducts,
} from "@/features/catalog/queries";
import {
  ActionButton,
  ConfirmDelete,
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
const productStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
] as const;
const currency = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);

type ProductSubmission = { input: ProductInput; image: File | null };

function ProductForm({
  current,
  onClose,
  onSave,
  isSaving,
  requestError,
}: {
  current: Product | null;
  onClose: () => void;
  onSave: (submission: ProductSubmission) => void;
  isSaving: boolean;
  requestError: string;
}) {
  const metadata = useCatalogOptions();
  const categories = metadata.data?.categories ?? [];
  const allSubcategories = metadata.data?.subcategories ?? [];
  const brands = metadata.data?.brands ?? [];
  const defaultVariant = current?.variants?.find(
    (variant) => variant.is_default,
  );
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [sku, setSku] = useState(defaultVariant?.sku ?? "");
  const [categoryId, setCategoryId] = useState(
    current?.subcategory?.parent_id
      ? String(current.subcategory.parent_id)
      : "",
  );
  const [subcategoryId, setSubcategoryId] = useState(
    current?.primary_category_id ? String(current.primary_category_id) : "",
  );
  const [brandId, setBrandId] = useState(
    current?.brand_id ? String(current.brand_id) : "",
  );
  const [description, setDescription] = useState(current?.description ?? "");
  const [shortDescription, setShortDescription] = useState(
    current?.short_description ?? "",
  );
  const [price, setPrice] = useState(String(current?.new_price ?? ""));
  const [oldPrice, setOldPrice] = useState(String(current?.old_price ?? ""));
  const [status, setStatus] = useState<ProductStatus>(
    current?.status ?? "draft",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const subcategories = allSubcategories.filter(
    (item) => item.parent_id === Number(categoryId),
  );
  const existingImage =
    current?.images?.find((image) => image.is_primary)?.url ?? null;

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setValidationError("Choose a JPG, PNG, WEBP or AVIF image under 5 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setValidationError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(price);
    const previous = oldPrice ? Number(oldPrice) : null;
    const normalizedSlug = slugify(slug || name);
    if (
      !name.trim() ||
      !normalizedSlug ||
      !sku.trim() ||
      !categoryId ||
      !subcategoryId
    ) {
      setValidationError(
        "Complete all required product, SKU and category fields.",
      );
      return;
    }
    if (!description.trim()) {
      setValidationError("A full product description is required.");
      return;
    }
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      (previous !== null && (!Number.isFinite(previous) || previous < amount))
    ) {
      setValidationError(
        "Enter valid prices; compare-at price cannot be lower than the current price.",
      );
      return;
    }
    if (!current && status === "active" && !imageFile) {
      setValidationError(
        "Upload a primary image before creating an active product.",
      );
      return;
    }
    setValidationError("");
    onSave({
      input: {
        category_id: Number(categoryId),
        subcategory_id: Number(subcategoryId),
        brand_id: brandId ? Number(brandId) : null,
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim(),
        short_description: shortDescription.trim() || null,
        status,
        sku: sku.trim(),
        price: amount,
        compare_at_price: previous,
      },
      image: imageFile,
    });
  }

  const metadataLoading = metadata.isLoading;
  const metadataError = metadata.error
    ? catalogErrorMessage(metadata.error)
    : "";
  return (
    <Modal
      title={current ? "Edit product" : "Add new product"}
      subtitle="Create a complete, validated product listing for your beauty catalog."
      size="wide"
      onClose={onClose}
    >
      <form className="catalog-form" onSubmit={submit} noValidate>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>01</span>
            <div>
              <h3>Product information</h3>
              <p>Core merchandising and storefront details.</p>
            </div>
          </div>
          <div className="catalog-form-grid">
            <Field label="Product name" required>
              <input
                autoFocus
                maxLength={220}
                className="catalog-input"
                placeholder="e.g. Rose Glow Face Serum"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!current) setSlug(slugify(event.target.value));
                }}
              />
            </Field>
            <Field label="URL slug" required>
              <input
                maxLength={240}
                className="catalog-input"
                placeholder="rose-glow-face-serum"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </Field>
            <Field label="SKU" required>
              <input
                maxLength={80}
                className="catalog-input"
                placeholder="GC-SRM-008"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
              />
            </Field>
            <Field label="Brand">
              <SelectDropdown
                id="product-brand"
                aria-label="Select brand"
                fullWidth
                disabled={metadataLoading}
                value={brandId}
                onChange={setBrandId}
                placeholder="No brand"
                options={[
                  { value: "", label: "No brand" },
                  ...brands.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  })),
                ]}
                menuHeader="Brand"
              />
            </Field>
            <Field label="Category" required>
              <SelectDropdown
                id="product-category"
                aria-label="Select category"
                fullWidth
                disabled={metadataLoading}
                value={categoryId}
                onChange={(value) => {
                  setCategoryId(value);
                  setSubcategoryId("");
                }}
                placeholder="Select category"
                options={categories.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                menuHeader="Category"
              />
            </Field>
            <Field label="Subcategory" required>
              <SelectDropdown
                id="product-subcategory"
                aria-label="Select subcategory"
                fullWidth
                disabled={!categoryId || !subcategories.length}
                value={subcategoryId}
                onChange={setSubcategoryId}
                placeholder="Select subcategory"
                options={subcategories.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                menuHeader="Subcategory"
              />
            </Field>
          </div>
          <Field
            label="Short description"
            hint="Used in compact product cards and search previews."
          >
            <input
              maxLength={500}
              className="catalog-input"
              placeholder="One-line customer-facing summary"
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
            />
          </Field>
          <Field label="Full description" required>
            <textarea
              className="catalog-input catalog-textarea"
              rows={4}
              maxLength={100000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe benefits, usage and key product details."
            />
          </Field>
        </div>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>02</span>
            <div>
              <h3>Pricing & publication</h3>
              <p>Configure the default sellable variant and visibility.</p>
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
            <Field label="Publication status">
              <SelectDropdown
                id="product-status"
                aria-label="Publication status"
                fullWidth
                value={status}
                onChange={(value) => setStatus(value as ProductStatus)}
                options={productStatusOptions.filter(
                  (option) => option.value !== "all",
                )}
                menuHeader="Status"
              />
            </Field>
          </div>
        </div>
        <div className="catalog-form-section">
          <div className="catalog-form-section-header">
            <span>03</span>
            <div>
              <h3>Primary image</h3>
              <p>
                Real image uploads are stored through the catalog media API.
              </p>
            </div>
          </div>
          <div className="catalog-image-editor">
            <div className="catalog-image-preview">
              {imagePreview || existingImage ? (
                <Image
                  unoptimized
                  width={125}
                  height={125}
                  src={imagePreview ?? existingImage!}
                  alt="Product image preview"
                />
              ) : (
                <Icon name="package" size={34} />
              )}
            </div>
            <div className="catalog-image-controls">
              <label className="catalog-upload-control">
                <Icon name="package" size={17} /> Choose image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImage}
                  className="sr-only"
                />
              </label>
              <small>JPG, PNG, WEBP or AVIF · Max 5 MB</small>
              {imageFile && <small>Selected: {imageFile.name}</small>}
            </div>
          </div>
        </div>
        {(validationError || requestError || metadataError) && (
          <p className="catalog-field-error" role="alert">
            {validationError || requestError || metadataError}
          </p>
        )}
        <div className="catalog-form-footer">
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            disabled={isSaving || metadataLoading || Boolean(metadataError)}
          >
            {isSaving
              ? "Saving product…"
              : current
                ? "Save product"
                : "Add to catalog"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const optionsQuery = useCatalogOptions();
  const summaryQuery = useCatalogSummary();
  const categories = optionsQuery.data?.categories ?? [];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const productsQuery = useProducts({
    page,
    perPage: PAGE_SIZE,
    search: debouncedSearch,
    status,
    ...(categoryFilter === "all" ? {} : { categoryId: Number(categoryFilter) }),
  });
  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const summary = summaryQuery.data?.products;
  const pageError =
    productsQuery.error ?? summaryQuery.error ?? optionsQuery.error;

  const saveMutation = useMutation({
    mutationFn: async ({ input, image }: ProductSubmission) => {
      if (editing === "new") {
        const created = await createProduct(input);
        if (image) await uploadProductImage(created.id, image, input.name);
        return input.status === "draft"
          ? created
          : setProductStatus(created.id, input.status);
      }
      if (!editing) throw new Error("No product selected.");
      if (image) await uploadProductImage(editing.id, image, input.name);
      const defaultVariant = editing.variants?.find(
        (variant) => variant.is_default,
      );
      if (defaultVariant && defaultVariant.sku !== input.sku) {
        await updateProductVariant(editing.id, defaultVariant.id, {
          sku: input.sku,
          price: input.price,
          compare_at_price: input.compare_at_price,
        });
      }
      return updateProduct(editing.id, input);
    },
    onSuccess: async (saved) => {
      await invalidateProductCatalog(queryClient);
      setEditing(null);
      setNotice(`${saved.name} has been saved.`);
    },
    onError: async () => {
      await invalidateProductCatalog(queryClient);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (product: Product) => deleteProduct(product.id),
    onSuccess: async (_, product) => {
      await invalidateProductCatalog(queryClient);
      setDeleting(null);
      setNotice(`${product.name} has been removed.`);
    },
  });

  function resetPage(update: () => void) {
    update();
    setPage(1);
  }
  return (
    <PermissionGate permission="catalog.products.read">
      <div className="catalog-page">
        <PageHeading
          title="Products"
          description="Create, organize and manage your live beauty product catalog."
          action={
            <ActionButton onClick={() => setEditing("new")}>
              <span className="catalog-plus">+</span> Add new product
            </ActionButton>
          }
        />
        <div className="catalog-stats-grid">
          <StatCard
            label="Total products"
            value={summary?.total ?? "—"}
            detail="All catalog records"
          />
          <StatCard
            label="Published"
            value={summary?.active ?? "—"}
            detail="Visible in your storefront"
            icon="tag"
            tone="green"
          />
          <StatCard
            label="Draft"
            value={summary?.draft ?? "—"}
            detail="Awaiting publication"
            icon="layers"
            tone="purple"
          />
          <StatCard
            label="Inactive"
            value={summary?.inactive ?? "—"}
            detail="Hidden from customers"
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
        {pageError && (
          <div className="catalog-field-error" role="alert">
            {catalogErrorMessage(pageError)}
          </div>
        )}
        <Panel
          title="Product catalog"
          subtitle="Server-backed product records with live filtering and pagination."
          action={
            <span className="catalog-count">{meta?.total ?? 0} products</span>
          }
        >
          <ListToolbar
            search={search}
            setSearch={(value) => resetPage(() => setSearch(value))}
            status={status}
            setStatus={(value) => resetPage(() => setStatus(value))}
            statusOptions={productStatusOptions}
            placeholder="Search by product name or SKU..."
          >
            <SelectDropdown
              id="catalog-filter-category"
              aria-label="Filter category"
              value={categoryFilter}
              onChange={(value) => resetPage(() => setCategoryFilter(value))}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                })),
              ]}
              menuHeader="Category"
            />
          </ListToolbar>
          <TableScroll>
            <table
              className="catalog-table"
              aria-busy={productsQuery.isFetching}
            >
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Brand</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="catalog-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const primaryImage =
                    item.images?.find((image) => image.is_primary) ??
                    item.images?.[0];
                  const defaultVariant = item.variants?.find(
                    (variant) => variant.is_default,
                  );
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="catalog-name-cell">
                          <span
                            className="catalog-product-avatar"
                            aria-hidden="true"
                          >
                            {primaryImage ? (
                              <Image
                                unoptimized
                                width={44}
                                height={44}
                                src={primaryImage.url}
                                alt=""
                              />
                            ) : (
                              <Icon name="package" size={20} />
                            )}
                          </span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>
                              {defaultVariant?.sku || "No SKU"} · #{item.id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="catalog-category-name">
                          {item.subcategory?.parent?.name ?? "—"}
                          <small>{item.subcategory?.name ?? "—"}</small>
                        </div>
                      </td>
                      <td>{item.brand?.name ?? "—"}</td>
                      <td>
                        <div className="catalog-price">
                          <strong>{currency(item.new_price)}</strong>
                          {item.old_price !== null && (
                            <del>{currency(item.old_price)}</del>
                          )}
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          {!productsQuery.isLoading && !products.length && <TableEmpty />}
          <Pagination
            count={meta?.total ?? 0}
            page={meta?.current_page ?? page}
            onPageChange={setPage}
            size={PAGE_SIZE}
          />
        </Panel>
      </div>
      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          current={editing === "new" ? null : editing}
          onSave={(submission) => saveMutation.mutate(submission)}
          isSaving={saveMutation.isPending}
          requestError={
            saveMutation.isError ? catalogErrorMessage(saveMutation.error) : ""
          }
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
          onConfirm={() => deleteMutation.mutate(deleting)}
        />
      )}
    </PermissionGate>
  );
}
