// ============================================================
// FACEBOOK PAGES API ADAPTER
// Social Media Page Automation Tool — Pixzora Labs
// Dependency class: C (free but conditional — [VERIFY] App Review)
// Graph API version: v21.0 [VERIFY — pin and update as needed]
// ============================================================

import type { SocialPublisher, PublishRequest, PublishResult } from "./types";

const GRAPH_API_VERSION = "v21.0"; // [VERIFY] pin version
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookPublisher implements SocialPublisher {
  platform = "facebook";

  /**
   * Publish an image post to a Facebook Page.
   * 
   * Strategy: Upload image bytes directly to avoid public URL instability.
   * [VERIFY] Facebook supports multipart image upload via /page-id/photos
   */
  async publishImagePost(req: PublishRequest): Promise<PublishResult> {
    if (!req.imageBuffer && !req.imageUrl) {
      throw new FacebookError("Either imageBuffer or imageUrl is required", 400);
    }

    const endpoint = `${GRAPH_BASE}/${req.pageId}/photos`;

    let body: FormData | URLSearchParams;
    let headers: Record<string, string> = {};

    if (req.imageBuffer) {
      // Upload image bytes as multipart form
      const form = new FormData();
      const blob = new Blob([new Uint8Array(req.imageBuffer)], { type: "image/jpeg" });
      form.append("source", blob, "post.jpg");
      form.append("caption", req.caption);
      form.append("access_token", req.accessToken);
      form.append("published", "true");
      body = form;
    } else {
      // Fallback: public URL
      const params = new URLSearchParams({
        url: req.imageUrl!,
        caption: req.caption,
        access_token: req.accessToken,
        published: "true",
      });
      body = params;
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(60_000), // 60 s timeout
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new FacebookError(
        data.error?.message ?? `Facebook API error ${response.status}`,
        response.status,
        data.error?.code,
        data.error?.type
      );
    }

    const platformPostId: string = data.post_id ?? data.id;
    if (!platformPostId) {
      throw new FacebookError("Facebook returned no post ID", 0);
    }

    const postLink = `https://www.facebook.com/${platformPostId}`;

    return {
      platformPostId,
      postLink,
      publishedAt: new Date(),
    };
  }

  /**
   * Reconciliation: check the Page's recent posts for content matching our post.
   * Called after a timeout to prevent duplicate sends.
   * 
   * Facebook has no native idempotency key [VERIFY].
   * Match strategy: caption prefix match + time window.
   */
  async reconcile(
    pageId: string,
    accessToken: string,
    caption: string,
    afterUtc: Date,
    windowMinutes = 10
  ): Promise<PublishResult | null> {
    const since = Math.floor(afterUtc.getTime() / 1000);
    const until = Math.floor(
      (afterUtc.getTime() + windowMinutes * 60 * 1000) / 1000
    );

    const url = new URL(`${GRAPH_BASE}/${pageId}/posts`);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("fields", "id,message,created_time,permalink_url");
    url.searchParams.set("since", String(since));
    url.searchParams.set("until", String(until));
    url.searchParams.set("limit", "10");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const posts: Array<{
      id: string;
      message?: string;
      created_time: string;
      permalink_url?: string;
    }> = data.data ?? [];

    // Match: first 100 chars of caption
    const captionPrefix = caption.slice(0, 100).toLowerCase();

    for (const post of posts) {
      const messagePrefix = (post.message ?? "").slice(0, 100).toLowerCase();
      if (messagePrefix.includes(captionPrefix.slice(0, 50))) {
        return {
          platformPostId: post.id,
          postLink: post.permalink_url,
          publishedAt: new Date(post.created_time),
        };
      }
    }

    return null;
  }

  /**
   * Verify the Page connection is valid and the token has publishing permissions.
   */
  async verifyConnection(
    pageId: string,
    accessToken: string
  ): Promise<{ ok: boolean; errorMessage?: string }> {
    try {
      const url = new URL(`${GRAPH_BASE}/${pageId}`);
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("fields", "id,name,tasks");

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10_000),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          ok: false,
          errorMessage: data.error?.message ?? `HTTP ${response.status}`,
        };
      }

      const tasks: string[] = data.tasks ?? [];
      if (!tasks.includes("MANAGE") && !tasks.includes("CREATE_CONTENT")) {
        return {
          ok: false,
          errorMessage: "Page token lacks MANAGE or CREATE_CONTENT permission",
        };
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}

export class FacebookError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fbCode?: number,
    public readonly fbType?: string
  ) {
    super(message);
    this.name = "FacebookError";
  }

  /** Classify for the recovery engine */
  classify(): "transient" | "content" | "permission" | "token_expired" | "unknown" {
    if (this.fbCode === 190) return "token_expired";
    if (this.fbCode === 200 || this.fbCode === 230) return "permission";
    if (this.fbType === "OAuthException") return "token_expired";
    if (this.statusCode >= 500) return "transient";
    if (this.statusCode === 429) return "transient"; // rate limit
    if (this.statusCode >= 400 && this.statusCode < 500) return "content";
    return "unknown";
  }
}
