// ============================================================
// DRIZZLE ORM DATABASE SCHEMA
// Social Media Page Automation Tool — Pixzora Labs
// PostgreSQL 16 · UTC timestamps · UUID keys · 3NF
// ============================================================

import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────

export const platformEnum = pgEnum("platform", ["facebook"]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "publishing",
  "published",
  "retry_pending",
  "blocked",
  "needs_review",
  "skipped",
  "cancelled",
]);

export const generationStatusEnum = pgEnum("generation_status", [
  "requested",
  "processing",
  "partly_complete",
  "ready",
  "failed",
]);

export const generationItemStatusEnum = pgEnum("generation_item_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const draftStatusEnum = pgEnum("draft_status", [
  "draft",
  "ready",
  "approved",
  "archived",
]);

export const pageConnectionStatusEnum = pgEnum("page_connection_status", [
  "connected",
  "disconnected",
  "token_expired",
  "error",
]);

export const scheduleModeEnum = pgEnum("schedule_mode", [
  "fixed_slots",
  "interval",
]);

export const attemptOutcomeEnum = pgEnum("attempt_outcome", [
  "success",
  "transient_failure",
  "content_failure",
  "permission_failure",
  "token_expired",
  "timeout",
  "unknown",
]);

export const testPostStatusEnum = pgEnum("test_post_status", [
  "requested",
  "sent",
  "confirmed",
  "failed",
  "cleaned_up",
]);

export const assetKindEnum = pgEnum("asset_kind", [
  "logo",
  "template_background",
  "original_image",
  "final_image",
  "font",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "batch_ready",
  "publish_failure",
  "scheduler_stalled",
  "low_queue",
  "token_expiring",
  "missed_slots",
  "quota_warning",
]);

// ── Audit helper columns ────────────────────────────────────

const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

// ── 1. Access ───────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    totpSecret: text("totp_secret"), // encrypted at rest
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  ...auditColumns,
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull().unique(), // module.action format
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("role_permissions_unique").on(t.roleId, t.permissionId)]
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    grantedBy: uuid("granted_by"),
  },
  (t) => [uniqueIndex("user_roles_unique").on(t.userId, t.roleId)]
);

export const userPermissionGrants = pgTable(
  "user_permission_grants",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [uniqueIndex("user_perm_grants_unique").on(t.userId, t.permissionId)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    ...auditColumns,
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_token_idx").on(t.token),
  ]
);

// ── 2. Pages ────────────────────────────────────────────────

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: platformEnum("platform").notNull().default("facebook"),
  platformPageId: varchar("platform_page_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 300 }).notNull(),
  pictureUrl: text("picture_url"),
  isActive: boolean("is_active").notNull().default(true),
  queueEnabled: boolean("queue_enabled").notNull().default(false), // blocked until test post passes
  ...auditColumns,
});

export const pageConnections = pgTable(
  "page_connections",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    status: pageConnectionStatusEnum("status").notNull().default("disconnected"),
    accessTokenEncrypted: text("access_token_encrypted"), // AES-256-GCM, never plain text
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    lastHealthCheckAt: timestamp("last_health_check_at", {
      withTimezone: true,
    }),
    lastHealthStatus: text("last_health_status"),
    connectedById: uuid("connected_by_id").references(() => users.id),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [index("page_connections_page_id_idx").on(t.pageId)]
);

export const pageSettings = pgTable("page_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: uuid("page_id")
    .notNull()
    .unique()
    .references(() => pages.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Europe/London"),
  defaultAudience: text("default_audience"),
  defaultTone: varchar("default_tone", { length: 100 }).default("professional"),
  defaultLanguage: varchar("default_language", { length: 10 })
    .notNull()
    .default("en-GB"),
  ...auditColumns,
});

// ── 3. Scheduling ───────────────────────────────────────────

export const scheduleSettings = pgTable("schedule_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: uuid("page_id")
    .notNull()
    .unique()
    .references(() => pages.id, { onDelete: "cascade" }),
  mode: scheduleModeEnum("mode").notNull().default("fixed_slots"),
  allowedWeekdays: integer("allowed_weekdays").array().notNull().default(sql`ARRAY[1,2,3,4,5]`), // 1=Mon..7=Sun ISO
  dailySlotTimes: text("daily_slot_times").array(), // e.g. ["09:00","13:00","19:00"] local time
  intervalFirstPublishTime: timestamp("interval_first_publish_time", { withTimezone: true }),
  intervalGapMinutes: integer("interval_gap_minutes"),
  allowedHoursStart: varchar("allowed_hours_start", { length: 5 }), // "09:00"
  allowedHoursEnd: varchar("allowed_hours_end", { length: 5 }),   // "19:00"
  minimumSpacingMinutes: integer("minimum_spacing_minutes").notNull().default(30),
  lowQueueThreshold: integer("low_queue_threshold").notNull().default(3),
  isPaused: boolean("is_paused").notNull().default(false),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  pausedById: uuid("paused_by_id").references(() => users.id),
  ...auditColumns,
});

// ── 4. Templates and AI Settings ───────────────────────────

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  version: integer("version").notNull().default(1),
  logoAssetId: uuid("logo_asset_id"),
  primaryColour: varchar("primary_colour", { length: 9 }),
  secondaryColour: varchar("secondary_colour", { length: 9 }),
  fontFamily: varchar("font_family", { length: 100 }).notNull().default("Inter"),
  layout: jsonb("layout"), // SVG template config
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  ...auditColumns,
});

export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  textProvider: varchar("text_provider", { length: 100 }).notNull().default("gemini"),
  textModel: varchar("text_model", { length: 200 }).notNull().default("gemini-1.5-flash"),
  imageProvider: varchar("image_provider", { length: 100 }).notNull().default("cloudflare-workers-ai"),
  imageModel: varchar("image_model", { length: 200 }).notNull().default("@cf/black-forest-labs/flux-1-schnell"),
  imageFallbackProvider: varchar("image_fallback_provider", { length: 100 }).notNull().default("sharp-gradient"),
  maxConcurrentGenerations: integer("max_concurrent_generations").notNull().default(3),
  dailyGenerationCap: integer("daily_generation_cap").notNull().default(50),
  monthlyGenerationCap: integer("monthly_generation_cap").notNull().default(1000),
  maxRetries: integer("max_retries").notNull().default(3),
  // Keys are never stored here — they come from environment variables
  ...auditColumns,
});

// ── 5. Assets ───────────────────────────────────────────────

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    kind: assetKindEnum("kind").notNull(),
    storageKey: text("storage_key").notNull(), // e.g. "assets/final/2026/10/uuid.webp"
    storageProvider: varchar("storage_provider", { length: 50 })
      .notNull()
      .default("r2"),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(), // SHA-256 hex
    publicUrl: text("public_url"),
    width: integer("width"),
    height: integer("height"),
    isOrphaned: boolean("is_orphaned").notNull().default(false),
    ...auditColumns,
  },
  (t) => [index("assets_storage_key_idx").on(t.storageKey)]
);

// ── 6. Generation ───────────────────────────────────────────

export const generationRequests = pgTable(
  "generation_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id),
    templateId: uuid("template_id").references(() => templates.id),
    topic: text("topic").notNull(),
    instructions: text("instructions"),
    postCount: integer("post_count").notNull().default(1),
    referenceText: text("reference_text"), // treated as content, not instructions
    audience: text("audience"),
    tone: varchar("tone", { length: 100 }),
    language: varchar("language", { length: 10 }).notNull().default("en-GB"),
    status: generationStatusEnum("status").notNull().default("requested"),
    n8nExecutionId: varchar("n8n_execution_id", { length: 200 }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    index("gen_requests_page_id_idx").on(t.pageId),
    index("gen_requests_status_idx").on(t.status),
  ]
);

export const generationItems = pgTable(
  "generation_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    requestId: uuid("request_id")
      .notNull()
      .references(() => generationRequests.id, { onDelete: "cascade" }),
    position: integer("position").notNull(), // 1-based order within batch
    status: generationItemStatusEnum("status").notNull().default("pending"),
    caption: text("caption"),
    headline: varchar("headline", { length: 500 }),
    subheading: varchar("subheading", { length: 500 }),
    hashtags: text("hashtags").array(),
    imagePrompt: text("image_prompt"),
    factualReviewFlags: jsonb("factual_review_flags"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    draftId: uuid("draft_id"), // set when draft is saved
    ...auditColumns,
  },
  (t) => [
    index("gen_items_request_id_idx").on(t.requestId),
    index("gen_items_draft_id_idx").on(t.draftId),
  ]
);

// ── 7. Content ──────────────────────────────────────────────

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id),
    generationItemId: uuid("generation_item_id").references(
      () => generationItems.id
    ),
    topic: text("topic"),
    status: draftStatusEnum("status").notNull().default("draft"),
    currentVersionId: uuid("current_version_id"), // FK set after first version
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    archivedById: uuid("archived_by_id").references(() => users.id),
    ...auditColumns,
  },
  (t) => [
    index("drafts_page_id_status_idx").on(t.pageId, t.status),
    index("drafts_topic_idx").on(t.topic),
  ]
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id),
    versionNumber: integer("version_number").notNull(),
    caption: text("caption").notNull(),
    headline: varchar("headline", { length: 500 }).notNull(),
    subheading: varchar("subheading", { length: 500 }),
    hashtags: text("hashtags").array(),
    imagePrompt: text("image_prompt"),
    templateId: uuid("template_id").references(() => templates.id),
    templateVersion: integer("template_version"),
    headlineHash: varchar("headline_hash", { length: 64 }), // SHA-256 of rendered headline
    originalImageAssetId: uuid("original_image_asset_id").references(
      () => assets.id
    ),
    finalImageAssetId: uuid("final_image_asset_id").references(() => assets.id),
    finalImageMatchesHeadline: boolean("final_image_matches_headline")
      .notNull()
      .default(false),
    isApproved: boolean("is_approved").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedById: uuid("approved_by_id").references(() => users.id),
    ...auditColumns,
  },
  (t) => [
    index("content_versions_draft_id_idx").on(t.draftId),
    index("content_versions_approved_idx").on(t.isApproved),
  ]
);

// ── 8. Queue and Publishing ─────────────────────────────────

export const queueItems = pgTable(
  "queue_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id),
    contentVersionId: uuid("content_version_id")
      .notNull()
      .references(() => contentVersions.id),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id),
    queueOrder: integer("queue_order").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(), // UTC
    status: jobStatusEnum("status").notNull().default("queued"),
    idempotencyKey: uuid("idempotency_key")
      .notNull()
      .default(sql`gen_random_uuid()`),
    leaseOwner: varchar("lease_owner", { length: 200 }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    approvedById: uuid("approved_by_id")
      .notNull()
      .references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
    blockedReason: text("blocked_reason"),
    retryCount: integer("retry_count").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    // Primary query index for due-job lookup
    index("queue_items_page_status_scheduled_idx").on(
      t.pageId,
      t.status,
      t.scheduledAt
    ),
    index("queue_items_queue_order_idx").on(t.pageId, t.queueOrder),
    // Prevent duplicate active slots per Page
    uniqueIndex("queue_items_page_scheduled_active_idx")
      .on(t.pageId, t.scheduledAt)
      .where(sql`status NOT IN ('cancelled', 'skipped', 'published')`),
  ]
);

// Partial unique index: one active queue job per content version
// Created in migration as raw SQL:
// CREATE UNIQUE INDEX queue_items_one_active_per_version
//   ON queue_items(content_version_id)
//   WHERE status NOT IN ('cancelled', 'skipped', 'published');

export const publishingAttempts = pgTable(
  "publishing_attempts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    queueItemId: uuid("queue_item_id")
      .notNull()
      .references(() => queueItems.id),
    attemptNumber: integer("attempt_number").notNull(),
    attemptStartedAt: timestamp("attempt_started_at", {
      withTimezone: true,
    }).notNull(),
    sentMarkerAt: timestamp("sent_marker_at", { withTimezone: true }), // set just before API call
    outcome: attemptOutcomeEnum("outcome"),
    outcomeAt: timestamp("outcome_at", { withTimezone: true }),
    remotePostId: varchar("remote_post_id", { length: 200 }),
    errorCode: varchar("error_code", { length: 100 }),
    errorMessageRedacted: text("error_message_redacted"), // PII and secrets stripped
    workerId: varchar("worker_id", { length: 200 }),
    ...auditColumns,
  },
  (t) => [index("pub_attempts_queue_item_idx").on(t.queueItemId)]
);

export const publishedPosts = pgTable(
  "published_posts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    queueItemId: uuid("queue_item_id")
      .notNull()
      .unique()
      .references(() => queueItems.id),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id),
    platformPostId: varchar("platform_post_id", { length: 200 }).notNull(),
    postLink: text("post_link"),
    actualPublishedAt: timestamp("actual_published_at", {
      withTimezone: true,
    }).notNull(),
    ...auditColumns,
  },
  (t) => [
    index("published_posts_page_idx").on(t.pageId),
    index("published_posts_platform_post_id_idx").on(t.platformPostId),
  ]
);

// ── 9. Test Posts (isolated from production queue) ──────────

export const testPosts = pgTable("test_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  status: testPostStatusEnum("status").notNull().default("requested"),
  caption: text("caption").notNull(),
  imageAssetId: uuid("image_asset_id").references(() => assets.id),
  platformPostId: varchar("platform_post_id", { length: 200 }),
  postLink: text("post_link"),
  errorMessage: text("error_message"),
  cleanedUpAt: timestamp("cleaned_up_at", { withTimezone: true }),
  requestedById: uuid("requested_by_id")
    .notNull()
    .references(() => users.id),
  ...auditColumns,
});

// ── 10. Operations ──────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id), // null = system action
    action: varchar("action", { length: 200 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    provider: varchar("provider", { length: 100 }).notNull(),
    model: varchar("model", { length: 200 }),
    callType: varchar("call_type", { length: 50 }).notNull(), // "text" | "image"
    tokenCount: integer("token_count"),
    imageCount: integer("image_count"),
    estimatedCostUsd: integer("estimated_cost_usd"), // micro-USD, null = free
    freeQuotaUsed: integer("free_quota_used"),
    generationRequestId: uuid("generation_request_id").references(
      () => generationRequests.id
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("usage_records_provider_idx").on(t.provider, t.callType),
    index("usage_records_created_at_idx").on(t.createdAt),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    body: text("body").notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    sentVia: varchar("sent_via", { length: 100 }), // "telegram" | "in_app" | "email"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("notifications_is_read_idx").on(t.isRead),
    index("notifications_type_idx").on(t.type),
  ]
);

export const systemHeartbeats = pgTable("system_heartbeats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  component: varchar("component", { length: 100 }).notNull(), // "n8n-scheduler" | "backend"
  lastHeartbeatAt: timestamp("last_heartbeat_at", {
    withTimezone: true,
  }).notNull(),
  metadata: jsonb("metadata"),
});
