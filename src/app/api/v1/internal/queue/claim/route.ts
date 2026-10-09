import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queueItems, contentVersions, drafts } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // 1. Find the next due job
    // We look for jobs that are "queued" and scheduledAt is in the past or now
    const dueJobs = await db
      .select({
        queueItemId: queueItems.id,
        contentVersionId: queueItems.contentVersionId,
        draftId: queueItems.draftId,
      })
      .from(queueItems)
      .where(
        and(
          eq(queueItems.status, "queued"),
          lte(queueItems.scheduledAt, new Date())
        )
      )
      .orderBy(queueItems.queueOrder)
      .limit(1);

    if (!dueJobs || dueJobs.length === 0) {
      return NextResponse.json({ job: null });
    }

    const job = dueJobs[0];

    // 2. Mark as publishing (Atomic claim for MVP)
    await db
      .update(queueItems)
      .set({ status: "publishing" })
      .where(eq(queueItems.id, job.queueItemId));

    // 3. Get the content
    const versionData = await db
      .select()
      .from(contentVersions)
      .where(eq(contentVersions.id, job.contentVersionId))
      .limit(1);

    if (!versionData || versionData.length === 0) {
      return NextResponse.json({ success: false, error: "Content not found" });
    }

    const content = versionData[0];
    
    // Format Facebook caption
    const hashtags = Array.isArray(content.hashtags) 
      ? content.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(" ") 
      : "";
      
    const finalCaption = `${content.caption}\n\n${hashtags}`;

    return NextResponse.json({
      job: {
        id: job.queueItemId,
        headline: content.headline,
        caption: finalCaption,
      },
    });

  } catch (error: any) {
    console.error("Queue claim error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
