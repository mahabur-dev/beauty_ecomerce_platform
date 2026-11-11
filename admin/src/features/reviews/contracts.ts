import { z } from "zod";

const nullableString = z.string().nullable();

export const reviewStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "hidden",
]);
export const reviewModerationTargetSchema = z.enum([
  "approved",
  "rejected",
  "hidden",
]);
export const reviewSortSchema = z.enum([
  "newest",
  "oldest",
  "highest",
  "lowest",
]);
export const reviewTrashFilterSchema = z.enum(["without", "with", "only"]);
export const reviewMediaKindSchema = z.enum(["image", "video"]);
export const reviewMediaStatusSchema = z.enum(["ready", "rejected"]);

export const reviewMediaSchema = z.object({
  id: z.coerce.number().int().positive(),
  review_id: z.coerce.number().int().positive(),
  kind: reviewMediaKindSchema,
  format: z.string(),
  mime_type: z.string(),
  bytes: z.coerce.number().int().nonnegative(),
  width: z.coerce.number().int().nonnegative().nullable(),
  height: z.coerce.number().int().nonnegative().nullable(),
  duration_seconds: z.coerce.number().nonnegative().nullable(),
  sort_order: z.coerce.number().int().nonnegative(),
  status: reviewMediaStatusSchema,
  url: z.string().url(),
  url_expires_at: z.string(),
  created_at: nullableString,
});

export const reviewReplySchema = z.object({
  id: z.coerce.number().int().positive(),
  body: z.string(),
  author_name: z.string(),
  admin_user_id: z.coerce.number().int().positive().optional(),
  author: z
    .object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  created_at: nullableString,
  updated_at: nullableString,
});

export const reviewAuditLogSchema = z.object({
  id: z.coerce.number().int().positive(),
  action: z.string(),
  actor: z
    .object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
    })
    .nullable(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  ip_address: nullableString,
  created_at: z.string(),
});

export const adminReviewSchema = z.object({
  id: z.coerce.number().int().positive(),
  product_id: z.coerce.number().int().positive(),
  user_id: z.coerce.number().int().positive(),
  vendor_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  title: nullableString,
  body: nullableString,
  status: reviewStatusSchema,
  verified_purchase: z.boolean(),
  moderation_reason: nullableString,
  lock_version: z.coerce.number().int().positive(),
  submitted_at: nullableString,
  published_at: nullableString,
  moderated_at: nullableString,
  deleted_at: nullableString,
  created_at: nullableString,
  updated_at: nullableString,
  product: z
    .object({
      id: z.coerce.number().int().positive(),
      vendor_id: z.coerce.number().int().positive(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
  author: z
    .object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  moderator: z
    .object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  media: z.array(reviewMediaSchema).optional().default([]),
  reply: reviewReplySchema.nullable().optional(),
  audit_logs: z.array(reviewAuditLogSchema).optional(),
});

export const reviewPaginationMetaSchema = z.object({
  current_page: z.coerce.number().int().positive(),
  from: z.coerce.number().int().nonnegative().nullable(),
  last_page: z.coerce.number().int().positive(),
  per_page: z.coerce.number().int().positive(),
  to: z.coerce.number().int().nonnegative().nullable(),
  total: z.coerce.number().int().nonnegative(),
});

export const paginatedAdminReviewsSchema = z.object({
  data: z.array(adminReviewSchema),
  meta: reviewPaginationMetaSchema,
});

export const adminReviewResponseSchema = z.object({
  data: adminReviewSchema,
});

export const reviewReplyResponseSchema = z.object({
  data: reviewReplySchema,
});

export const reviewProductOptionsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
});

export const MODERATION_REASON_MIN_LENGTH = 3;
export const MODERATION_REASON_MAX_LENGTH = 500;
export const REPLY_BODY_MIN_LENGTH = 2;
export const REPLY_BODY_MAX_LENGTH = 2000;

export const moderateReviewFormSchema = z.object({
  status: reviewModerationTargetSchema,
  reason: z
    .string()
    .trim()
    .min(
      MODERATION_REASON_MIN_LENGTH,
      `Moderation reason must be at least ${MODERATION_REASON_MIN_LENGTH} characters.`,
    )
    .max(
      MODERATION_REASON_MAX_LENGTH,
      `Moderation reason cannot exceed ${MODERATION_REASON_MAX_LENGTH} characters.`,
    ),
});

export const reviewReplyFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(
      REPLY_BODY_MIN_LENGTH,
      `Official reply must be at least ${REPLY_BODY_MIN_LENGTH} characters.`,
    )
    .max(
      REPLY_BODY_MAX_LENGTH,
      `Official reply cannot exceed ${REPLY_BODY_MAX_LENGTH} characters.`,
    ),
});

export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewModerationTarget = z.infer<
  typeof reviewModerationTargetSchema
>;
export type ReviewSort = z.infer<typeof reviewSortSchema>;
export type ReviewTrashFilter = z.infer<typeof reviewTrashFilterSchema>;
export type ReviewMediaItem = z.infer<typeof reviewMediaSchema>;
export type ReviewReply = z.infer<typeof reviewReplySchema>;
export type ReviewAuditLog = z.infer<typeof reviewAuditLogSchema>;
export type AdminReview = z.infer<typeof adminReviewSchema>;
export type ReviewProductOption =
  z.infer<typeof reviewProductOptionsResponseSchema>["data"][number];

