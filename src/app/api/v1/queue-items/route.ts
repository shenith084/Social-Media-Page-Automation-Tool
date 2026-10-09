import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// ── Shared response helpers ────────────────────────────────

function successResponse<T>(data: T, message = "Success", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

function errorResponse(message: string, errorCode: string, status = 400) {
  return NextResponse.json({ success: false, message, errorCode, data: null }, { status });
}

// ── Bulk Add to Publishing Queue ───────────────────────────

const BulkAddSchema = z.object({
  /** Ordered list of draft IDs to approve. First-in, first-scheduled. */
  draftIds: z.array(z.string().uuid()).min(1).max(50),
  /** Idempotency key: repeated submission with same key returns existing jobs, not duplicates. */
  idempotencyKey: z.string().uuid().optional(),
});

/**
 * POST /api/v1/queue-items/bulk-add
 * 
 * Atomically approves drafts and assigns publishing times.
 * Idempotent: duplicate requests with the same idempotency key return existing jobs.
 * Returns per-item results with assigned times and individual rejections.
 * 
 * Required: queue.approve permission (checked server-side).
 */
export async function POST(request: NextRequest) {
  // TODO: verify session and queue.approve permission

  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;

  try {
    const body = await request.json();
    const parsed = BulkAddSchema.safeParse({ ...body, idempotencyKey });

    if (!parsed.success) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 422);
    }

    const { draftIds } = parsed.data;
    const key = idempotencyKey ?? crypto.randomUUID();

    // TODO (implementation):
    // 1. BEGIN TRANSACTION
    // 2. For each draftId in order:
    //    a. SELECT draft + current content version, validate completeness
    //    b. Check page connection and queue.approve permission
    //    c. INSERT into content_versions (approved copy) ON CONFLICT DO NOTHING
    //    d. INSERT into queue_items (idempotencyKey) ON CONFLICT (content_version_id) WHERE active → return existing
    //    e. assignNextSlot() from scheduling engine
    // 3. COMMIT — all or nothing
    // 4. Create audit log entries
    // 5. Return per-item results

    // Mock response
    const results = draftIds.map((draftId, i) => ({
      draftId,
      queueItemId: crypto.randomUUID(),
      scheduledAt: new Date(Date.now() + (i + 1) * 4 * 3600 * 1000).toISOString(),
      scheduledAtLocal: "Tomorrow, 09:00 BST",
      status: "queued",
      outcome: "added",
    }));

    return successResponse(
      {
        idempotencyKey: key,
        added: results.filter((r) => r.outcome === "added").length,
        alreadyQueued: 0,
        rejected: 0,
        results,
      },
      `${results.length} post(s) added to the publishing queue`
    );
  } catch {
    return errorResponse("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }
}

/**
 * GET /api/v1/queue-items
 * List current queue items with pagination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const status = searchParams.get("status") ?? undefined;

  // TODO: fetch from DB ordered by queue_order
  return successResponse({
    items: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  });
}
