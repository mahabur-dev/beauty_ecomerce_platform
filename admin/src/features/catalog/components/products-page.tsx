"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  setProductStatus,
  slugify,
  updateProduct,
  updateProductImage,
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
        currency: "BDT",
        currencyDisplay: "narrowSymbol",
      }).format(value);

type ProductSubmission = {
  input: ProductInput;
  newImages: File[];
  deleteImageIds?: number[] | undefined;
  primaryChoice?: {
    type: "existing" | "new";
    id?: number | undefined;
    newIndex?: number | undefined;
  } | undefined;
};

type NewImageItem = { id: string; file: File; previewUrl: string };

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

  // Gallery state (up to 5 images max)
  const maxImages = 5;
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<NewImageItem[]>([]);
  const [validationError, setValidationError] = useState("");

  const remainingExisting = (current?.images ?? []).filter(
    (image) => !removedImageIds.includes(image.id),
  );
  const totalImageCount = remainingExisting.length + newImages.length;

  const [primaryKey, setPrimaryKey] = useState<string>(() => {
    const existingPrimary = current?.images?.find((img) => img.is_primary);
    if (existingPrimary) return `existing:${existingPrimary.id}`;
    const firstImg = current?.images?.[0];
    if (firstImg) {
      return `existing:${firstImg.id}`;
    }
    return "";
  });

  const subcategories = allSubcategories.filter(
    (item) => item.parent_id === Number(categoryId),
  );

  useEffect(() => {
    return () => {
      newImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [newImages]);

  function handleImageFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = maxImages - totalImageCount;
    if (availableSlots <= 0) {
      setValidationError(
        "You have already reached the maximum limit of 5 images.",
      );
      event.target.value = "";
      return;
    }

    const selectedList = Array.from(files);
    const validFiles: NewImageItem[] = [];

    for (const file of selectedList) {
      if (validFiles.length >= availableSlots) break;
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        setValidationError("Choose JPG, PNG, WEBP or AVIF images under 5 MB.");
        continue;
      }
      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (selectedList.length > availableSlots) {
      setValidationError(
        `Only ${availableSlots} more image(s) could be added. Maximum is 5 images.`,
      );
    } else {
      setValidationError("");
    }

    if (validFiles.length > 0) {
      setNewImages((prev) => [...prev, ...validFiles]);
      // If no primary image is currently active, designate the first newly added image
      const firstValid = validFiles[0];
      if (!primaryKey && remainingExisting.length === 0 && firstValid) {
        setPrimaryKey(`new:${firstValid.id}`);
      }
    }

    event.target.value = "";
  }

  function removeNewImage(id: string) {
    setNewImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const remaining = prev.filter((item) => item.id !== id);

      if (primaryKey === `new:${id}`) {
        const firstExisting = remainingExisting[0];
        const firstRemainingNew = remaining[0];
        if (firstExisting) {
          setPrimaryKey(`existing:${firstExisting.id}`);
        } else if (firstRemainingNew) {
          setPrimaryKey(`new:${firstRemainingNew.id}`);
        } else {
          setPrimaryKey("");
        }
      }
      return remaining;
    });
    setValidationError("");
  }

  function removeExistingImage(id: number) {
    setRemovedImageIds((prev) => [...prev, id]);
    if (primaryKey === `existing:${id}`) {
      const nextExisting = remainingExisting.find((img) => img.id !== id);
      const firstNew = newImages[0];
      if (nextExisting) {
        setPrimaryKey(`existing:${nextExisting.id}`);
      } else if (firstNew) {
        setPrimaryKey(`new:${firstNew.id}`);
      } else {
        setPrimaryKey("");
      }
    }
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
    if (!current && status === "active" && totalImageCount === 0) {
      setValidationError(
        "Upload at least one image before creating an active product.",
      );
      return;
    }
    if (totalImageCount > maxImages) {
      setValidationError("A product can have a maximum of 5 images.");
      return;
    }
    setValidationError("");

    let primaryChoice: ProductSubmission["primaryChoice"] = undefined;
    if (primaryKey.startsWith("existing:")) {
      const existingId = Number(primaryKey.replace("existing:", ""));
      primaryChoice = { type: "existing", id: existingId };
    } else if (primaryKey.startsWith("new:")) {
      const newId = primaryKey.replace("new:", "");
      const index = newImages.findIndex((item) => item.id === newId);
      primaryChoice = {
        type: "new",
        newIndex: index >= 0 ? index : 0,
      };
    } else {
      const firstRemaining = remainingExisting[0];
      if (firstRemaining) {
        primaryChoice = { type: "existing", id: firstRemaining.id };
      } else if (newImages.length > 0) {
        primaryChoice = { type: "new", newIndex: 0 };
      }
    }

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
      newImages: newImages.map((item) => item.file),
      deleteImageIds: removedImageIds,
      ...(primaryChoice ? { primaryChoice } : {}),
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
            <Field label="Current price (৳)" required>
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
            <Field label="Compare at price (৳)">
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
              <h3>
                Product gallery ({totalImageCount} of {maxImages})
              </h3>
              <p>
                Upload up to 5 images for your storefront product gallery. Click any thumbnail to designate it as the Primary image.
              </p>
            </div>
          </div>
          <div className="catalog-gallery-uploader">
            <div className="catalog-gallery-grid">
              {/* Existing images */}
              {remainingExisting.map((img, idx) => {
                const isSelectedPrimary = primaryKey === `existing:${img.id}`;
                return (
                  <div
                    key={img.id}
                    className={`catalog-gallery-tile ${isSelectedPrimary ? "catalog-gallery-tile-primary" : ""}`}
                    onClick={() => setPrimaryKey(`existing:${img.id}`)}
                    title={isSelectedPrimary ? "Primary storefront image" : "Click to set as primary"}
                  >
                    <Image
                      unoptimized
                      width={90}
                      height={90}
                      src={img.url}
                      alt={img.alt_text || `Product image ${idx + 1}`}
                    />
                    {isSelectedPrimary ? (
                      <span className="catalog-gallery-badge-primary">★ Primary</span>
                    ) : (
                      <button
                        type="button"
                        className="catalog-gallery-set-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryKey(`existing:${img.id}`);
                        }}
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      type="button"
                      className="catalog-gallery-remove"
                      title="Remove image"
                      aria-label={`Remove image ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingImage(img.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Newly added images */}
              {newImages.map((img, idx) => {
                const isSelectedPrimary = primaryKey === `new:${img.id}`;
                return (
                  <div
                    key={img.id}
                    className={`catalog-gallery-tile ${isSelectedPrimary ? "catalog-gallery-tile-primary" : ""}`}
                    onClick={() => setPrimaryKey(`new:${img.id}`)}
                    title={isSelectedPrimary ? "Primary storefront image" : "Click to set as primary"}
                  >
                    <Image
                      unoptimized
                      width={90}
                      height={90}
                      src={img.previewUrl}
                      alt={`New upload preview ${idx + 1}`}
                    />
                    {isSelectedPrimary ? (
                      <span className="catalog-gallery-badge-primary">★ Primary</span>
                    ) : (
                      <button
                        type="button"
                        className="catalog-gallery-set-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryKey(`new:${img.id}`);
                        }}
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      type="button"
                      className="catalog-gallery-remove"
                      title="Remove image"
                      aria-label={`Remove new image ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNewImage(img.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Upload Tile if below max 5 */}
              {totalImageCount < maxImages && (
                <label
                  className="catalog-gallery-add-button"
                  title="Upload images"
                >
                  <Icon name="package" size={20} />
                  <span>+ Add image</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImageFiles}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <div className="catalog-gallery-counter">
              <span>
                {totalImageCount === 0
                  ? "No images selected yet (max 5)."
                  : `${totalImageCount} of ${maxImages} images selected.`}{" "}
                Supports JPG, PNG, WEBP, AVIF (Max 5 MB each).
              </span>
            </div>
          </div>
        </div>
        {(validationError || requestError || metadataError) && (
          <DismissibleNotice
            variant="error"
            message={validationError || requestError || metadataError}
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

export function ProductDetailModal({
  product,
  onClose,
  onEdit,
}: {
  product: Product;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const primaryImage =
    product.images?.find((image) => image.is_primary) ?? product.images?.[0];
  const defaultVariant = product.variants?.find(
    (variant) => variant.is_default,
  );

  return (
    <Modal
      title="Product details"
      subtitle={`Detailed overview for ${product.name}`}
      onClose={onClose}
    >
      <div className="catalog-detail-container">
        <div className="catalog-detail-header">
          <div className="catalog-detail-avatar-product">
            {primaryImage ? (
              <Image
                unoptimized
                width={56}
                height={56}
                src={primaryImage.url}
                alt={product.name}
              />
            ) : (
              <Icon name="package" size={26} />
            )}
          </div>
          <h3 className="catalog-detail-title">{product.name}</h3>
          <div className="catalog-detail-header-meta-row">
            <StatusBadge value={product.status} />
            <span className="catalog-slug">/{product.slug}</span>
            {defaultVariant?.sku && (
              <span className="catalog-slug">SKU: {defaultVariant.sku}</span>
            )}
          </div>
        </div>

        <div className="catalog-detail-meta">
          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Category</span>
            <span className="catalog-detail-value">
              {product.subcategory?.parent?.name ?? "—"}
            </span>
          </div>

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Subcategory</span>
            <span className="catalog-detail-value">
              {product.subcategory?.name ?? "—"}
            </span>
          </div>

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Brand</span>
            <span className="catalog-detail-value">
              {product.brand?.name ?? "—"}
            </span>
          </div>

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Price (New)</span>
            <span className="catalog-detail-value">
              <strong>{currency(product.new_price)}</strong>
            </span>
          </div>

          {product.old_price !== null && (
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Original price (Old)</span>
              <span className="catalog-detail-value">
                <del>{currency(product.old_price)}</del>
              </span>
            </div>
          )}

          <div className="catalog-detail-row">
            <span className="catalog-detail-label">Record ID</span>
            <span className="catalog-detail-value">
              <code className="catalog-detail-code">#{product.id}</code>
            </span>
          </div>

          {product.created_at && (
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Created date</span>
              <span className="catalog-detail-value">
                {new Date(product.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Gallery thumbnails */}
        {product.images && product.images.length > 0 && (
          <div className="catalog-detail-gallery">
            <span className="catalog-detail-section-title">
              Product gallery ({product.images.length} of 5 images)
            </span>
            <div className="catalog-gallery-grid">
              {product.images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`catalog-gallery-item ${img.is_primary ? "catalog-gallery-item-primary" : ""}`}
                >
                  <Image
                    unoptimized
                    width={58}
                    height={58}
                    src={img.url}
                    alt={img.alt_text || `Product image ${idx + 1}`}
                  />
                  {img.is_primary && (
                    <span className="catalog-gallery-primary-tag">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="catalog-detail-section">
          <span className="catalog-detail-section-title">Description</span>
          {product.description ? (
            <p className="catalog-detail-desc">{product.description}</p>
          ) : (
            <p className="catalog-detail-desc-empty">
              No description provided for this product.
            </p>
          )}
        </div>

        <div className="catalog-detail-footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          {onEdit && (
            <ActionButton variant="primary" onClick={onEdit}>
              Edit product
            </ActionButton>
          )}
        </div>
      </div>
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
  const [viewing, setViewing] = useState<Product | null>(null);
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
    mutationFn: async ({
      input,
      newImages,
      deleteImageIds,
      primaryChoice,
    }: ProductSubmission) => {
      if (editing === "new") {
        const created = await createProduct(input);
        const primaryNewIndex =
          primaryChoice?.type === "new" ? (primaryChoice.newIndex ?? 0) : 0;
        for (let i = 0; i < newImages.length; i++) {
          const file = newImages[i];
          if (!file) continue;
          await uploadProductImage(
            created.id,
            file,
            `${input.name} - ${i + 1}`,
            i === primaryNewIndex,
            i,
          );
        }
        return input.status === "draft"
          ? created
          : setProductStatus(created.id, input.status);
      }
      if (!editing) throw new Error("No product selected.");

      // Delete removed images
      if (deleteImageIds && deleteImageIds.length > 0) {
        for (const imgId of deleteImageIds) {
          await deleteProductImage(editing.id, imgId);
        }
      }

      const remainingExisting = (editing.images ?? []).filter(
        (img) => !deleteImageIds?.includes(img.id),
      );

      // Upload new images
      const primaryNewIndex =
        primaryChoice?.type === "new" ? (primaryChoice.newIndex ?? -1) : -1;
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        if (!file) continue;
        const isThisPrimary = i === primaryNewIndex;
        await uploadProductImage(
          editing.id,
          file,
          `${input.name} - ${remainingExisting.length + i + 1}`,
          isThisPrimary,
          remainingExisting.length + i,
        );
      }

      // If an existing image was chosen as primary, ensure it is set as primary
      if (primaryChoice?.type === "existing" && primaryChoice.id) {
        await updateProductImage(editing.id, primaryChoice.id, {
          is_primary: true,
        });
      }

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
      {viewing && (
        <ProductDetailModal
          product={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const target = viewing;
            setViewing(null);
            setEditing(target);
          }}
        />
      )}
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
