import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queueItems, publishedPosts, drafts, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { queueItemId, success, platformPostId, errorMessage } = body;

    if (!queueItemId) {
      return NextResponse.json({ success: false, error: "Missing queueItemId" }, { status: 400 });
    }

    const jobData = await db.select().from(queueItems).where(eq(queueItems.id, queueItemId)).limit(1);
    if (!jobData || jobData.length === 0) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    const job = jobData[0];

    if (success) {
      // Mark Queue item as published
      await db
        .update(queueItems)
        .set({ status: "published" })
        .where(eq(queueItems.id, queueItemId));

      // Mark Draft as published
      await db
        .update(drafts)
        .set({ status: "published" })
        .where(eq(drafts.id, job.draftId));

      // Record published post
      await db.insert(publishedPosts).values({
        queueItemId: queueItemId,
        pageId: job.pageId,
        platformPostId: platformPostId || "unknown",
        postLink: `https://facebook.com/${platformPostId}`,
        actualPublishedAt: new Date(),
      });

    } else {
      // Mark Queue item as blocked
      await db
        .update(queueItems)
        .set({ 
          status: "blocked",
          blockedReason: errorMessage || "Unknown publishing error"
        })
        .where(eq(queueItems.id, queueItemId));
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Queue callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
