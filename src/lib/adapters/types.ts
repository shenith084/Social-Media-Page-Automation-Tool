// ============================================================
// ADAPTER INTERFACES
// Social Media Page Automation Tool — Pixzora Labs
// Provider-agnostic adapters for all external services
// ============================================================

// ── Text AI Adapter ─────────────────────────────────────────

export interface GeneratedContent {
  caption: string;
  headline: string;
  subheading?: string;
  imagePrompt: string;
  hashtags: string[];
  factualReviewFlags?: string[];
}

export interface TextGenerationRequest {
  topic: string;
  instructions?: string;
  referenceText?: string; // treated as content, NOT instructions
  audience?: string;
  tone?: string;
  language: string;
  count: number;
}

export interface TextAiProvider {
  name: string;
  generateContent(req: TextGenerationRequest): Promise<GeneratedContent[]>;
  estimateTokens(text: string): number;
  checkQuota(): Promise<{ remaining: number; resetAt: Date }>;
}

// ── Image AI Adapter ────────────────────────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  width: number;
  height: number;
  style?: string;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

export interface ImageProvider {
  name: string;
  generateImage(req: ImageGenerationRequest): Promise<GeneratedImage>;
  checkQuota(): Promise<{ remaining: number; resetAt: Date }>;
}

// ── Storage Adapter ─────────────────────────────────────────

export interface StorageUploadResult {
  key: string;
  publicUrl?: string;
  sizeBytes: number;
  checksum: string;
}

export interface StorageProvider {
  name: string;
  upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ── Social Publisher Adapter ────────────────────────────────

export interface PublishRequest {
  pageId: string;
  accessToken: string; // decrypted, held only in memory
  caption: string;
  imageBuffer?: Buffer;
  imageUrl?: string; // used only if imageBuffer is not available
  idempotencyKey: string;
}

export interface PublishResult {
  platformPostId: string;
  postLink?: string;
  publishedAt: Date;
}

export interface SocialPublisher {
  platform: string;
  publishImagePost(req: PublishRequest): Promise<PublishResult>;
  /**
   * Reconcile: check recent page posts to see if our content was published.
   * Used after a timeout to avoid duplicate sends.
   */
  reconcile(
    pageId: string,
    accessToken: string,
    caption: string,
    afterUtc: Date,
    windowMinutes?: number
  ): Promise<PublishResult | null>;
  verifyConnection(
    pageId: string,
    accessToken: string
  ): Promise<{ ok: boolean; errorMessage?: string }>;
}

// ── Notifier Adapter ────────────────────────────────────────

export type NotificationChannel = "telegram" | "email" | "in_app";

export interface NotificationPayload {
  title: string;
  body: string;
  channel: NotificationChannel;
  entityType?: string;
  entityId?: string;
}

export interface Notifier {
  send(payload: NotificationPayload): Promise<void>;
}

// ── Provider Registry ────────────────────────────────────────

export interface ProviderRegistry {
  textAi: TextAiProvider;
  imageAi: ImageProvider;
  imageFallback: ImageProvider;
  storage: StorageProvider;
  publisher: SocialPublisher;
  notifier: Notifier;
}
