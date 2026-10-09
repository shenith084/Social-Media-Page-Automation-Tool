import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generationRequests, generationItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status, posts } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Missing requestId" }, { status: 400 });
    }

    if (status === "failed") {
      // Mimic Workflow 6
      await db.update(generationRequests)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(generationRequests.id, requestId));
        
      await db.insert(generationItems).values({
        requestId: requestId,
        position: 1,
        status: "failed",
        caption: "Generation Failed",
        headline: "Error",
        imagePrompt: "Error",
        hashtags: [],
      });
      
      return NextResponse.json({ success: true });
    }

    if (!posts || !Array.isArray(posts)) {
       return NextResponse.json({ success: false, error: "Missing posts array" }, { status: 400 });
    }

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      await db.insert(generationItems).values({
        requestId: requestId,
        position: i + 1,
        status: "complete",
        caption: post.caption,
        headline: post.headline,
        subheading: post.subheading,
        hashtags: post.hashtags,
        imagePrompt: post.imagePrompt,
        factualReviewFlags: post.factualReviewFlags,
      });
    }

    await db.update(generationRequests)
      .set({ status: "ready", completedAt: new Date() })
      .where(eq(generationRequests.id, requestId));
      
    // Optional: could revalidate paths if we want UI to pick it up on next refresh
    // revalidatePath("/drafts");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
