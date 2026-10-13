"use server";

import { db } from "@/lib/db";
import { queueItems, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removeQueueItemAction(queueItemId: string) {
  try {
    await db.update(queueItems)
      .set({ status: "cancelled" })
      .where(eq(queueItems.id, queueItemId));

    revalidatePath("/queue");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function toggleQueuePauseAction(isCurrentlyPaused: boolean) {
  try {
    const activePage = await db.query.pages.findFirst({
      where: eq(pages.isActive, true),
    });
    const targetPage = activePage || (await db.select().from(pages).limit(1))[0];
    
    if (targetPage) {
      await db.update(pages)
        .set({ queueEnabled: isCurrentlyPaused })
        .where(eq(pages.id, targetPage.id));
    }

    revalidatePath("/queue");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}