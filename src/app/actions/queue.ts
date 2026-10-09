"use server";

import { db } from "@/lib/db";
import { drafts, contentVersions, queueItems, generationItems, pages, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveAndQueueAction(generationItemId: string) {
  try {
    // 1. Get the Generation Item
    const itemData = await db
      .select()
      .from(generationItems)
      .where(eq(generationItems.id, generationItemId))
      .limit(1);

    if (!itemData || itemData.length === 0) {
      throw new Error("Generation item not found");
    }

    const item = itemData[0];

    // 2. Get the default Page
    const pageData = await db.select().from(pages).limit(1);
    if (!pageData || pageData.length === 0) {
      throw new Error("No page connected. Please connect a Facebook page first.");
    }
    const pageId = pageData[0].id;

    // 2.5 Get a user to satisfy approvedById
    const userData = await db.select().from(users).limit(1);
    if (!userData || userData.length === 0) {
      throw new Error("No admin user found. Please run the seed script.");
    }
    const userId = userData[0].id;

    // 3. Create Draft record if it doesn't exist
    let draftId = item.draftId;
    if (!draftId) {
      const newDraft = await db.insert(drafts).values({
        pageId: pageId,
        generationItemId: item.id,
        topic: "AI Generated Draft", // We could fetch from generationRequests but this is fine for MVP
        status: "approved",
      }).returning({ id: drafts.id });
      
      draftId = newDraft[0].id;

      // Update generationItem to point to draft
      await db.update(generationItems)
        .set({ draftId: draftId })
        .where(eq(generationItems.id, item.id));
    }

    // 4. Create Content Version
    const newVersion = await db.insert(contentVersions).values({
      draftId: draftId,
      versionNumber: 1,
      caption: item.caption || "",
      headline: item.headline || "",
      subheading: item.subheading,
      hashtags: item.hashtags,
      imagePrompt: item.imagePrompt,
      isApproved: true,
      approvedAt: new Date(),
      approvedById: userId,
    }).returning({ id: contentVersions.id });

    const contentVersionId = newVersion[0].id;

    // Update Draft to point to this version
    await db.update(drafts)
      .set({ currentVersionId: contentVersionId, status: "approved" })
      .where(eq(drafts.id, draftId));

    // 5. Schedule it (MVP: Next available hour slot)
    const queueData = await db.select({ maxOrder: sql<number>`max(${queueItems.queueOrder})` }).from(queueItems).where(eq(queueItems.pageId, pageId));
    const nextOrder = (queueData[0]?.maxOrder || 0) + 1;
    
    // Assign a time (Schedule for right NOW for testing purposes!)
    const scheduledTime = new Date();
    // scheduledTime.setDate(scheduledTime.getDate() + 1); // Tomorrow
    // scheduledTime.setHours(9 + nextOrder, 0, 0, 0);

    await db.insert(queueItems).values({
      pageId: pageId,
      contentVersionId: contentVersionId,
      draftId: draftId,
      queueOrder: nextOrder,
      scheduledAt: scheduledTime,
      status: "queued",
      approvedAt: new Date(),
      approvedById: userId,
    });

    // Revalidate paths so UI updates
    revalidatePath("/drafts");
    revalidatePath("/dashboard");
    revalidatePath("/queue");

    return { success: true };
  } catch (error: any) {
    console.error("Approve & Queue Error:", error);
    return { success: false, error: error.message };
  }
}
