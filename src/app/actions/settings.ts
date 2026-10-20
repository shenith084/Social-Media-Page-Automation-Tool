"use server";

import { db } from "@/lib/db";
import { scheduleSettings, pageSettings, pages, queueItems, testPosts, users, auditLogs } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assignSlots } from "@/lib/scheduling/engine";
import { FacebookPublisher } from "@/lib/adapters/facebook-publisher";
import crypto from "node:crypto";

export async function updateScheduleSettingsAction(
  pageId: string,
  data: {
    mode: "fixed_slots" | "interval";
    allowedWeekdays: number[];
    dailySlotTimes: string[];
    intervalGapMinutes: number;
    allowedHoursStart: string;
    allowedHoursEnd: string;
    minimumSpacingMinutes: number;
    timezone: string;
  }
) {
  try {
    // 1. Update or create scheduleSettings
    const existingSched = await db.query.scheduleSettings.findFirst({
      where: eq(scheduleSettings.pageId, pageId),
    });

    if (existingSched) {
      await db.update(scheduleSettings)
        .set({
          mode: data.mode,
          allowedWeekdays: data.allowedWeekdays,
          dailySlotTimes: data.dailySlotTimes,
          intervalGapMinutes: data.intervalGapMinutes,
          allowedHoursStart: data.allowedHoursStart,
          allowedHoursEnd: data.allowedHoursEnd,
          minimumSpacingMinutes: data.minimumSpacingMinutes,
          updatedAt: new Date(),
        })
        .where(eq(scheduleSettings.pageId, pageId));
    } else {
      await db.insert(scheduleSettings).values({
        pageId,
        mode: data.mode,
        allowedWeekdays: data.allowedWeekdays,
        dailySlotTimes: data.dailySlotTimes,
        intervalGapMinutes: data.intervalGapMinutes,
        allowedHoursStart: data.allowedHoursStart,
        allowedHoursEnd: data.allowedHoursEnd,
        minimumSpacingMinutes: data.minimumSpacingMinutes,
      });
    }

    // 2. Update pageSettings timezone
    const existingPageSetting = await db.query.pageSettings.findFirst({
      where: eq(pageSettings.pageId, pageId),
    });

    if (existingPageSetting) {
      await db.update(pageSettings)
        .set({
          timezone: data.timezone,
          updatedAt: new Date(),
        })
        .where(eq(pageSettings.pageId, pageId));
    } else {
      await db.insert(pageSettings).values({
        pageId,
        timezone: data.timezone,
      });
    }

    // 3. Audit log
    try {
      await db.insert(auditLogs).values({
        action: "settings.schedule_updated",
        entityType: "schedule_settings",
        entityId: pageId,
        metadata: data,
      });
    } catch { /* non-fatal */ }

    revalidatePath("/settings");
    revalidatePath("/queue");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function rebuildScheduleAction(pageId: string) {
  try {
    const sched = await db.query.scheduleSettings.findFirst({
      where: eq(scheduleSettings.pageId, pageId),
    });
    const pSetting = await db.query.pageSettings.findFirst({
      where: eq(pageSettings.pageId, pageId),
    });

    const timezone = pSetting?.timezone || "Europe/London";
    const mode = sched?.mode || "fixed_slots";
    const allowedWeekdays = sched?.allowedWeekdays || [1, 2, 3, 4, 5];
    const dailySlotTimes = sched?.dailySlotTimes || ["09:00", "13:00", "19:00"];
    const intervalGapMinutes = sched?.intervalGapMinutes || 120;
    const allowedHoursStart = sched?.allowedHoursStart || "09:00";
    const allowedHoursEnd = sched?.allowedHoursEnd || "19:00";
    const minimumSpacingMinutes = sched?.minimumSpacingMinutes || 30;

    // Fetch queued, unclaimed posts
    const queuedItems = await db.query.queueItems.findMany({
      where: and(
        eq(queueItems.pageId, pageId),
        eq(queueItems.status, "queued")
      ),
      orderBy: [asc(queueItems.queueOrder)],
    });

    if (queuedItems.length === 0) {
      return { success: true, count: 0, message: "No queued posts to rebuild." };
    }

    // Recalculate slots starting from current time
    const newSlots = assignSlots(
      {
        mode,
        timezone,
        allowedWeekdays,
        dailySlotTimes,
        intervalGapMinutes,
        allowedHoursStart,
        allowedHoursEnd,
        minimumSpacingMinutes,
      },
      queuedItems.length,
      new Date()
    );

    // Update each queue item
    for (let i = 0; i < queuedItems.length; i++) {
      await db.update(queueItems)
        .set({
          scheduledAt: newSlots[i],
          updatedAt: new Date(),
        })
        .where(eq(queueItems.id, queuedItems[i].id));
    }

    try {
      await db.insert(auditLogs).values({
        action: "schedule.rebuilt",
        entityType: "page",
        entityId: pageId,
        metadata: { postCount: queuedItems.length },
      });
    } catch { /* non-fatal */ }

    revalidatePath("/queue");
    revalidatePath("/calendar");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, count: queuedItems.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function runTestPostProofAction(pageId: string) {
  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      throw new Error("Page not found");
    }

    const userRec = await db.query.users.findFirst();
    const userId = userRec?.id;
    if (!userId) {
      throw new Error("No user found in database");
    }

    // Call Facebook publisher adapter for test post
    const publisher = new FacebookPublisher();
    const testResult = await publisher.publishImagePost({
      pageId: page.platformPageId,
      accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "",
      caption: `[Setup Proof] Pixzora Automation test post at ${new Date().toISOString()}`,
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80",
      idempotencyKey: `test-${crypto.randomUUID()}`,
    });

    // Insert into testPosts table
    const [testRecord] = await db.insert(testPosts).values({
      pageId,
      requestedById: userId,
      caption: `[Setup Proof] Pixzora Automation test post`,
      status: "confirmed",
      platformPostId: testResult.platformPostId,
      postLink: testResult.postLink,
      errorMessage: null,
    }).returning();

    // Enable queue publishing on the page
    await db.update(pages).set({ queueEnabled: true }).where(eq(pages.id, pageId));

    try {
      await db.insert(auditLogs).values({
        action: "test_post.confirmed",
        entityType: "test_post",
        entityId: testRecord.id,
        metadata: { platformPostId: testResult.platformPostId },
      });
    } catch { /* non-fatal */ }

    revalidatePath("/settings");
    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true, platformPostId: testResult.platformPostId, postLink: testResult.postLink };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
