import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  queueItems,
  contentVersions,
  publishedPosts,
  pages,
  systemHeartbeats,
  auditLogs,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  // 1. Authenticate webhook (dev bypass when secret is placeholder)
  const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  const devBypass = !webhookSecret || webhookSecret === "generate_another_64_hex_char_key";

  if (!devBypass) {
    const signature = request.headers.get("x-webhook-signature-256");
    const timestamp = request.headers.get("x-webhook-timestamp");
    if (!signature || !timestamp) {
      return NextResponse.json({ success: false, error: "Missing auth headers" }, { status: 401 });
    }
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      return NextResponse.json({ success: false, error: "Request too old" }, { status: 401 });
    }
    const rawBody = await request.text();
    const expectedSig = "sha256=" + crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  // 2. Ping scheduler heartbeat (non-fatal)
  try {
    await db.update(systemHeartbeats).set({ lastHeartbeatAt: new Date() }).where(eq(systemHeartbeats.component, "n8n-scheduler"));
  } catch { /* non-fatal */ }

  // 3. Atomic claim using FOR UPDATE SKIP LOCKED
  const workerId = `worker-${crypto.randomUUID()}`;
  const now = new Date();
  let claimedJobId: string | null = null;

  try {
    const claimed = await db.execute(sql`
      WITH eligible AS (
        SELECT qi.id
        FROM   queue_items qi
        JOIN   pages p ON p.id = qi.page_id
        WHERE  qi.status = 'queued'
          AND  qi.scheduled_at <= NOW()
          AND  p.queue_enabled = true
          AND  NOT EXISTS (
                 SELECT 1 FROM queue_items qi2
                 WHERE  qi2.page_id = qi.page_id
                   AND  qi2.queue_order < qi.queue_order
                   AND  qi2.status IN ('queued','publishing','retry_pending','needs_review','blocked')
               )
        ORDER  BY qi.scheduled_at ASC
        LIMIT  1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE queue_items
      SET    status = 'publishing',
             lease_owner = ${workerId},
             lease_expires_at = NOW() + INTERVAL '5 minutes',
             updated_at = NOW()
      FROM   eligible
      WHERE  queue_items.id = eligible.id
      RETURNING queue_items.id, queue_items.page_id, queue_items.content_version_id
    `);

    const rows = claimed as unknown as Array<{ id: string; page_id: string; content_version_id: string | null }>;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, workerId, message: "No job due at this tick", claimedJobId: null });
    }

    claimedJobId = rows[0].id;
    const pageId = rows[0].page_id;
    const contentVersionId = rows[0].content_version_id;

    if (!contentVersionId) {
      await db.update(queueItems).set({ status: "blocked", blockedReason: "No content version linked" }).where(eq(queueItems.id, claimedJobId));
      return NextResponse.json({ success: false, error: "No content version", claimedJobId });
    }

    const [cv] = await db.select().from(contentVersions).where(eq(contentVersions.id, contentVersionId)).limit(1);
    if (!cv) {
      await db.update(queueItems).set({ status: "blocked", blockedReason: "Content version not found" }).where(eq(queueItems.id, claimedJobId));
      return NextResponse.json({ success: false, error: "Content version not found", claimedJobId });
    }

    const fbPageId = process.env.FB_PAGE_ID;
    const fbToken = process.env.FB_ACCESS_TOKEN;
    if (!fbPageId || !fbToken) {
      await db.update(queueItems).set({ status: "blocked", blockedReason: "FB credentials not configured" }).where(eq(queueItems.id, claimedJobId));
      return NextResponse.json({ success: false, error: "Facebook credentials missing", claimedJobId });
    }

    const headline = cv.headline || "Viral Reels";
    const caption = cv.caption || "";

    // 4. Render image (non-fatal)
    let imageArrayBuffer: ArrayBuffer | null = null;
    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const imgRes = await fetch(`${appUrl}/api/v1/internal/render-image?headline=${encodeURIComponent(headline)}`, { cache: "no-store" });
      if (imgRes.ok) imageArrayBuffer = await imgRes.arrayBuffer();
    } catch { /* fallback to text-only */ }

    // 5. Publish to Facebook
    let fbResponse: Record<string, unknown> = {};
    let platformPostId: string | null = null;
    let publishSuccess = false;

    try {
      if (imageArrayBuffer) {
        const formData = new FormData();
        formData.append("message", caption);
        formData.append("source", new Blob([imageArrayBuffer], { type: "image/png" }), "post.png");
        const res = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${fbToken}` },
          body: formData,
        });
        fbResponse = (await res.json()) as Record<string, unknown>;
        publishSuccess = res.ok;
        platformPostId = (fbResponse.post_id as string) || (fbResponse.id as string) || null;
      } else {
        const body = new URLSearchParams({ message: caption, access_token: fbToken });
        const res = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        fbResponse = (await res.json()) as Record<string, unknown>;
        publishSuccess = res.ok;
        platformPostId = (fbResponse.id as string) || null;
      }
    } catch (e: unknown) {
      fbResponse = { error: e instanceof Error ? e.message : String(e) };
    }

    // 6. Record outcome
    if (publishSuccess && platformPostId) {
      await db.update(queueItems).set({ status: "published" }).where(eq(queueItems.id, claimedJobId));
      await db.insert(publishedPosts).values({
        queueItemId: claimedJobId, pageId, platformPostId,
        postLink: `https://www.facebook.com/${platformPostId}`,
        actualPublishedAt: new Date(),
      });
      try {
        await db.insert(auditLogs).values({
          action: "publish.success",
          entityType: "queue_item",
          entityId: claimedJobId,
          metadata: { headline, platformPostId },
        });
      } catch { /* non-fatal */ }

      revalidatePath("/dashboard"); revalidatePath("/queue"); revalidatePath("/calendar"); revalidatePath("/history");
      return NextResponse.json({ success: true, workerId, claimedJobId, platformPostId, message: "Published successfully" });
    } else {
      const fbErr = fbResponse?.error as Record<string, unknown> | undefined;
      const errCode = fbErr?.code as number | undefined;
      const errMsg = (fbErr?.message as string) || JSON.stringify(fbResponse);

      if (errCode === 190 || errCode === 102) {
        try { await db.update(pages).set({ queueEnabled: false }).where(eq(pages.id, pageId)); } catch { /* non-fatal */ }
      }

      const transient = [1, 2, 4, 17, 341, 368, 613];
      const newStatus: "retry_pending" | "needs_review" = transient.includes(errCode ?? 0) ? "retry_pending" : "needs_review";
      await db.update(queueItems).set({ status: newStatus, blockedReason: errMsg.substring(0, 500) }).where(eq(queueItems.id, claimedJobId));

      try {
        await db.insert(auditLogs).values({
          action: "publish.failed",
          entityType: "queue_item",
          entityId: claimedJobId,
          metadata: { headline, error: errMsg.substring(0, 300), errCode },
        });
      } catch { /* non-fatal */ }

      revalidatePath("/queue"); revalidatePath("/dashboard");
      return NextResponse.json({ success: false, workerId, claimedJobId, error: errMsg }, { status: 502 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[dispatch] Unexpected error:", err);
    if (claimedJobId) {
      try {
        await db.update(queueItems).set({ status: "needs_review", blockedReason: `Dispatch error: ${message}` }).where(eq(queueItems.id, claimedJobId));
      } catch { /* non-fatal */ }
    }
    return NextResponse.json({ success: false, error: message, claimedJobId }, { status: 500 });
  }
}