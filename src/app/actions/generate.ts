"use server";

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
  let requestId: string | null = null;
  try {
    let activePage = await db.query.pages.findFirst({
      where: eq(pages.isActive, true),
    });

    if (!activePage) {
      activePage = (await db.select().from(pages).limit(1))[0];
    }

    if (!activePage) {
      throw new Error("No connected page found. Please connect a Facebook page in Settings.");
    }

    const [requestRecord] = await db
      .insert(generationRequests)
      .values({
        pageId: activePage.id,
        topic,
        instructions,
        postCount: postCount || 1,
        audience,
        tone,
        referenceText,
        status: "processing",
      })
      .returning();

    requestId = requestRecord.id;

    // 1. Attempt n8n Webhook Workflow Execution ONLY if explicitly configured
    let n8nSuccess = false;
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl && n8nWebhookUrl.trim() !== "") {
      try {
        const n8nRes = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: requestRecord.id,
            topic,
            instructions,
            postCount: postCount || 1,
            tone,
            audience,
            referenceText,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (n8nRes.ok) {
          // Poll DB for callback completion
          const startTime = Date.now();
          while (Date.now() - startTime < 12000) {
            await new Promise((r) => setTimeout(r, 1000));
            const check = await db.query.generationRequests.findFirst({
              where: eq(generationRequests.id, requestRecord.id),
            });
            if (check && check.status === "ready") {
              n8nSuccess = true;
              break;
            }
          }
        }
      } catch (n8nErr) {
        console.warn("n8n webhook dispatch failed, falling back to direct AI:", n8nErr);
      }
    }

    // 2. Direct Gemini Fallback if n8n did not complete
    if (!n8nSuccess) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const primaryModel = process.env.TEXT_AI_MODEL || "gemini-2.5-flash";
      const modelsToTry = [primaryModel, "gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      const uniqueModels = Array.from(new Set(modelsToTry));

      const prompt = `You are a social media copywriter writing in British English.
Topic: ${topic}
Tone: ${tone}
Target Audience: ${audience || "General social media audience"}
Instructions: ${instructions || "Engaging social media post for Facebook"}
References: ${referenceText || "None"}

Generate ${postCount || 1} post(s). Return ONLY valid JSON matching this schema:
{
  "posts": [
    {
      "headline": "Catchy headline under 80 characters",
      "caption": "Full engaging caption with call to action in British English",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    }
  ]
}`;

      let rawText: string | null = null;
      let lastError: string | null = null;

      for (const model of uniqueModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (!res.ok) {
            const errBody = await res.text();
            lastError = `Model ${model} returned ${res.status}: ${errBody}`;
            continue;
          }

          const data = await res.json();
          const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extracted) {
            rawText = extracted;
            break;
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      if (!rawText) {
        throw new Error(`Failed to generate content from AI models: ${lastError || "Unknown error"}`);
      }

      let cleanedText = rawText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);
      const postsList = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed.posts) ? parsed.posts : [parsed]);

      let pos = 1;
      for (const p of postsList) {
        const hashtags = Array.isArray(p.hashtags)
          ? p.hashtags.map((h: unknown) => String(h).replace(/^#/, ""))
          : [];

        await db.insert(generationItems).values({
          requestId: requestRecord.id,
          headline: p.headline || topic,
          caption: p.caption || "",
          hashtags: hashtags,
          position: pos++,
          status: "complete",
        });
      }

      await db
        .update(generationRequests)
        .set({ status: "ready" })
        .where(eq(generationRequests.id, requestRecord.id));
    }

    revalidatePath("/drafts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI Generation Action Error:", error);
    if (requestId) {
      try {
        await db
          .update(generationRequests)
          .set({ status: "failed" })
          .where(eq(generationRequests.id, requestId));
      } catch { /* non-fatal */ }
    }
    return { success: false, error: message };
  }
}
