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
  try {
    let activePage = await db.query.pages.findFirst({
      where: eq(pages.isActive, true),
    });

    if (!activePage) {
      activePage = (await db.select().from(pages).limit(1))[0];
    }

    if (!activePage) {
      throw new Error("No connected page found.");
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

    // Directly call Google Gemini to guarantee instant creation if n8n is offline or async
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.TEXT_AI_MODEL || "gemini-3.5-flash";

    if (apiKey) {
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

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const postsList = parsed.posts || [parsed];

        let pos = 1;
        for (const p of postsList) {
          await db.insert(generationItems).values({
            requestId: requestRecord.id,
            headline: p.headline || topic,
            caption: p.caption || "",
            hashtags: p.hashtags || [],
            position: pos++,
            status: "complete",
          });
        }

        await db
          .update(generationRequests)
          .set({ status: "ready" })
          .where(eq(generationRequests.id, requestRecord.id));
      }
    }

    revalidatePath("/drafts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("AI Generation Action Error:", error);
    return { success: false, error: error.message };
  }
}
