"use server";

import { GeminiTextProvider } from "@/lib/adapters/gemini-text";
import { db } from "@/lib/db";
import { generationRequests, generationItems, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function generateContentAction(
  topic: string,
  instructions: string,
  postCount: number,
  tone: string,
  audience: string,
  referenceText: string
) {
  try {
    let activePage = await db.query.pages.findFirst({
      where: eq(pages.isActive, true),
    });

    if (!activePage) {
      const inserted = await db.insert(pages).values({
        name: "My Pixzora Page",
        platform: "facebook",
        platformPageId: "pending",
        isActive: true,
      }).returning();
      activePage = inserted[0];
    }

    const [requestRecord] = await db.insert(generationRequests).values({
      pageId: activePage.id,
      topic,
      instructions,
      postCount,
      audience,
      tone,
      referenceText,
      status: "processing",
    }).returning();

    // 3. Trigger n8n Workflow (Workflow 02) exactly as the Master Prompt mandates
    // Note: We use webhook-test for dev so we don't have to manually activate the workflow in n8n first
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/generate";
    
    // We await this request so Next.js doesn't kill the thread before the network request sends.
    // Since n8n webhooks respond immediately by default, this won't block the UI for long.
    try {
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: requestRecord.id,
          topic,
          instructions,
          postCount,
          tone,
          audience,
          referenceText,
        }),
      });
      console.log("Successfully pinged n8n webhook");
    } catch (err) {
      console.error("Failed to trigger n8n webhook:", err);
    }

    return { success: true };

  } catch (error: any) {
    console.error("AI Generation Setup Error:", error);
    return { success: false, error: error.message };
  }
}
