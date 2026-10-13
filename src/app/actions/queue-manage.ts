"use server";

import { db } from "@/lib/db";
import { queueItems } from "@/lib/db/schema";
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleQueuePauseAction(isCurrentlyPaused: boolean) {
  try {
    // Toggle state logic
    revalidatePath("/queue");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
