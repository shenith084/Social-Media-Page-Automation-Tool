"use server";

import { db } from "@/lib/db";
import { generationRequests, pages } from "@/lib/db/schema";
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
      throw new Error("No active page found. Please seed the database.");
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

    // Trigger n8n Workflow exactly as the Master Prompt mandates
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/generate";
    
    // We don't await this so it processes asynchronously in n8n
    fetch(n8nWebhookUrl, {
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
    }).catch(err => console.error("Failed to trigger n8n webhook:", err));

    revalidatePath("/drafts");
    return { success: true };

  } catch (error: any) {
    console.error("AI Generation Setup Error:", error);
    return { success: false, error: error.message };
  }
}
