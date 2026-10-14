import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generationRequests, generationItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, posts } = body;

    if (!requestId || !posts || !Array.isArray(posts)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    // Insert the generated items into the database
    let position = 1;
    for (const post of posts) {
      const caption = post.caption || "";
      const tags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) => t.replace('#', ''));
      await db.insert(generationItems).values({
        requestId: requestId,
        headline: post.headline || "Social Post",
        caption: caption,
        hashtags: tags,
        position: position,
        status: "complete",
      });
      position++;
    }

    // Update Request status to ready
    await db.update(generationRequests)
      .set({ status: "ready" })
      .where(eq(generationRequests.id, requestId));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Draft callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
