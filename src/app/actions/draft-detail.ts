"use server";

import { db } from "@/lib/db";
import { generationItems, drafts, contentVersions, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function archiveDraftAction(generationItemId: string) {
  const items = await db
    .select({ draftId: generationItems.draftId })
    .from(generationItems)
    .where(eq(generationItems.id, generationItemId))
    .limit(1);
  const draftId = items[0]?.draftId;

  if (draftId) {
    await db.update(drafts).set({ status: "archived" }).where(eq(drafts.id, draftId));
  }

  await db
    .update(generationItems)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(generationItems.id, generationItemId));

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

export async function updateDraftContentAction(
  generationItemId: string,
  headline: string,
  caption: string,
  hashtags: string[]
) {
  try {
    await db
      .update(generationItems)
      .set({
        headline,
        caption,
        hashtags,
        updatedAt: new Date(),
      })
      .where(eq(generationItems.id, generationItemId));

    const item = (
      await db
        .select()
        .from(generationItems)
        .where(eq(generationItems.id, generationItemId))
        .limit(1)
    )[0];

    if (item?.draftId) {
      const draft = (
        await db.select().from(drafts).where(eq(drafts.id, item.draftId)).limit(1)
      )[0];
      if (draft?.currentVersionId) {
        await db
          .update(contentVersions)
          .set({
            headline,
            caption,
            hashtags,
            updatedAt: new Date(),
          })
          .where(eq(contentVersions.id, draft.currentVersionId));
      }
    }

    try {
      await db.insert(auditLogs).values({
        action: "draft.edited",
        entityType: "generation_item",
        entityId: generationItemId,
        metadata: { headline, captionLength: caption.length },
      });
    } catch { /* non-fatal */ }

    revalidatePath(`/drafts/${generationItemId}`);
    revalidatePath("/drafts");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}