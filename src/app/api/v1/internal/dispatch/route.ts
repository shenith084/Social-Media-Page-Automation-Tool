import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// ── Internal endpoint: called by n8n every minute ──────────

/**
 * POST /api/v1/internal/dispatch
 * 
 * Security:
 * - Protected by a shared HMAC secret (INTERNAL_WEBHOOK_SECRET env var)
 * - Validates X-Webhook-Signature-256 header
 * - Validates X-Webhook-Timestamp (5-minute replay window)
 * - NOT exposed publicly beyond this endpoint
 * 
 * This endpoint atomically claims one eligible queue job and publishes it.
 * n8n never decides what is due — the backend is the single timing authority.
 * n8n never holds queue state — it only triggers this endpoint.
 */
export async function POST(request: NextRequest) {
  // ── 1. Authenticate webhook ────────────────────────────
  const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[dispatch] INTERNAL_WEBHOOK_SECRET not configured");
    return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
  }

  const signature = request.headers.get("x-webhook-signature-256");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ success: false, error: "Missing auth headers" }, { status: 401 });
  }

  // Replay protection: reject if older than 5 minutes
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    return NextResponse.json({ success: false, error: "Request too old" }, { status: 401 });
  }

  const rawBody = await request.text();
  const expectedSig =
    "sha256=" +
    crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Ping scheduler heartbeat ────────────────────────
  // TODO: UPDATE system_heartbeats SET last_heartbeat_at = now() WHERE component = 'n8n-scheduler'
  // TODO: also ping healthchecks.io dead-man's switch

  // ── 3. Claim one eligible job (atomic) ─────────────────
  // TODO (implementation with FOR UPDATE SKIP LOCKED):
  //
  // BEGIN;
  //   SELECT qi.* FROM queue_items qi
  //   JOIN pages p ON p.id = qi.page_id
  //   WHERE
  //     qi.status = 'queued'
  //     AND qi.scheduled_at <= now()
  //     AND p.queue_enabled = true
  //     AND NOT EXISTS (
  //       SELECT 1 FROM queue_items qi2
  //       WHERE qi2.page_id = qi.page_id
  //         AND qi2.queue_order < qi.queue_order
  //         AND qi2.status IN ('queued', 'publishing', 'retry_pending', 'needs_review', 'blocked')
  //     )
  //   ORDER BY qi.scheduled_at ASC
  //   LIMIT 1
  //   FOR UPDATE SKIP LOCKED;
  //
  //   UPDATE queue_items
  //   SET
  //     status = 'publishing',
  //     lease_owner = $workerId,
  //     lease_expires_at = now() + interval '5 minutes',
  //     updated_at = now()
  //   WHERE id = $claimedId;
  // COMMIT;

  const workerId = `worker-${crypto.randomUUID()}`;

  // ── 4. Re-check eligibility and publish ────────────────
  // TODO: verify approval, final asset, connection, ordering and minimum spacing
  // TODO: set attempt_started_at marker BEFORE the Facebook API call
  // TODO: call FacebookPublisher.publishImagePost()
  // TODO: on success: UPDATE queue_items SET status = 'published', INSERT published_posts
  // TODO: on timeout: UPDATE queue_items SET status = 'needs_review'
  // TODO: on transient failure: UPDATE queue_items SET status = 'retry_pending'
  // TODO: on content/permission failure: UPDATE queue_items SET status = 'blocked'
  // TODO: on token expiry: UPDATE pages SET queue_enabled = false, send notification

  return NextResponse.json({
    success: true,
    workerId,
    message: "Dispatch tick processed",
    claimedJobId: null, // null = no job due at this tick
  });
}
