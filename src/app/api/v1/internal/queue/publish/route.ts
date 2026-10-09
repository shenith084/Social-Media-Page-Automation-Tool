import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queueItems, drafts, contentVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { queueItemId } = await req.json();
    if (!queueItemId) return NextResponse.json({ error: "Missing queueItemId" }, { status: 400 });

    const jobResult = await db.select({
      job: queueItems,
      draft: drafts,
      contentVersion: contentVersions
    })
    .from(queueItems)
    .leftJoin(drafts, eq(queueItems.draftId, drafts.id))
    .leftJoin(contentVersions, eq(drafts.id, contentVersions.draftId))
    .where(eq(queueItems.id, queueItemId))
    .limit(1);

    if (!jobResult || jobResult.length === 0 || !jobResult[0].contentVersion) {
      return NextResponse.json({ error: "Job or content not found" }, { status: 404 });
    }

    const { headline, caption } = jobResult[0].contentVersion;
    
    // 1. Render the image directly
    const imgUrl = `http://localhost:3000/api/v1/internal/render-image?headline=${encodeURIComponent(headline)}`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) throw new Error("Failed to render image");
    const arrayBuffer = await imgRes.arrayBuffer();
    const file = new File([arrayBuffer], "post-image.png", { type: "image/png" });

    // 2. Upload to Facebook
    const pageId = process.env.FB_PAGE_ID;
    const token = process.env.FB_ACCESS_TOKEN;
    
    const form = new FormData();
    form.append("message", caption);
    form.append("source", file);

    const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    const fbData = await fbRes.json();
    
    if (!fbRes.ok) {
      // Update DB with block reason
      await db.update(queueItems)
        .set({ status: "blocked", blockedReason: `${fbRes.status} - ${JSON.stringify(fbData)}` })
        .where(eq(queueItems.id, queueItemId));
      return NextResponse.json({ success: false, error: fbData });
    }

    // Success! Update DB
    await db.update(queueItems)
      .set({ status: "published" }) // or you can leave it to another callback if needed, but we do it here for speed
      .where(eq(queueItems.id, queueItemId));

    return NextResponse.json({ success: true, fbData });
  } catch (error: any) {
    console.error("Publish error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
