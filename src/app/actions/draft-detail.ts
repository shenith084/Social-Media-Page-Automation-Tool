"use server";

import { db } from "@/lib/db";
import { generationItems, drafts, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function archiveDraftAction(generationItemId: string) {
  // generationItems status enum doesn't have "archived" - mark as "failed" to remove from active list
  // OR find the linked draft and mark it archived
  const items = await db.select({ draftId: generationItems.draftId }).from(generationItems).where(eq(generationItems.id, generationItemId)).limit(1);
  const draftId = items[0]?.draftId;

  if (draftId) {
    await db.update(drafts).set({ status: "archived" }).where(eq(drafts.id, draftId));
  }

  // Mark generation item as failed so it disappears from active lists
  await db.update(generationItems).set({ status: "failed", updatedAt: new Date() }).where(eq(generationItems.id, generationItemId));

  try {
    await db.insert(auditLogs).values({
      action: "draft.archived",
      entityType: "generation_item",
      entityId: generationItemId,
      metadata: { archivedAt: new Date().toISOString() },
    });
  } catch { /* non-fatal */ }

  revalidatePath("/drafts");
  revalidatePath("/dashboard");
  redirect("/drafts");
}