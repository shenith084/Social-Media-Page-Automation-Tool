import { Metadata } from "next";
import { db } from "@/lib/db";
import { generationItems, generationRequests } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { DraftsClient, DraftItem } from "@/components/admin/drafts-client";

export const metadata: Metadata = { title: "Draft Library | AutoSocial" };
export const dynamic = "force-dynamic";

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getPostImageUrl(headline: string, topic?: string | null): string {
  return `/api/v1/internal/render-image?headline=${encodeURIComponent(headline)}&prompt=${encodeURIComponent(topic || headline)}`;
}

export default async function DraftLibraryPage() {
  // Query all items from database (including n8n generated posts)
  const dbItems = await db
    .select({
      id: generationItems.id,
      headline: generationItems.headline,
      caption: generationItems.caption,
      status: generationItems.status,
      topic: generationRequests.topic,
      updatedAt: generationItems.updatedAt,
      createdAt: generationItems.createdAt,
    })
    .from(generationItems)
    .leftJoin(generationRequests, eq(generationItems.requestId, generationRequests.id))
    .where(eq(generationItems.status, "complete"))
    .orderBy(desc(generationItems.createdAt))
    .limit(30);

  // Fallback items using their respective live post images
  const initialItems: DraftItem[] = [
    {
      id: "99643e68-1228-4437-bf3b-81a58594799b",
      headline: "Top 6 AI Tools for Entrepreneurs in 2026",
      caption:
        "Are you ready to scale your business in 2026? As the landscape of entrepreneurship evolves, staying ahead of the curve means leveraging the right technologies.",
      status: "complete",
      date: "10/10/2026 • 1d ago",
      image: getPostImageUrl("Top 6 AI Tools for Entrepreneurs in 2026"),
    },
    {
      id: "e61531ef-2ef7-409d-97fe-707f07ed98d4",
      headline: "Elevate Your Brand with AI-Powered Content",
      caption:
        "In today's fast-paced digital landscape, staying ahead of the curve is essential. Generative AI is revolutionising how we approach content creation, offering...",
      status: "complete",
      date: "10/10/2026 • 1d ago",
      image: getPostImageUrl("Elevate Your Brand with AI-Powered Content"),
    },
    {
      id: "3563a262-65d6-49fe-abb6-7aeb1ebbfcc7",
      headline: "Is AI Superintelligence Arriving as Early as 2026?",
      caption:
        "Recent industry forecasts suggest that AI could surpass human intelligence across most tasks by 2026. This represents a significant shift for our society, each...",
      status: "complete",
      date: "10/10/2026 • 1d ago",
      image: getPostImageUrl("Is AI Superintelligence Arriving as Early as 2026?"),
    },
    {
      id: "4957e700-b5fa-4b75-acfc-1c85706e35eb",
      headline: "Is 2026 the year AI changes everything?",
      caption:
        "Could 2026 be the defining moment for Artificial Superintelligence? As the pace of innovation accelerates, industry experts are closely watching the next...",
      status: "pending",
      date: "10/10/2026 • 1d ago",
      image: getPostImageUrl("Is 2026 the year AI changes everything?"),
    },
  ];

  // Map any extra newly generated posts from n8n to show up with live post image
  const mappedDbItems: DraftItem[] = dbItems
    .filter((d) => d.headline && d.headline !== "Error")
    .map((d) => {
      const safeHeadline = d.headline || "Untitled Post";
      const dateStr = d.createdAt
        ? `${new Date(d.createdAt).toLocaleDateString("en-GB")} • ${formatRelative(d.createdAt.toISOString())}`
        : "10/10/2026 • 1d ago";

      return {
        id: d.id,
        headline: safeHeadline,
        caption: d.caption || "",
        status: (d.status as "complete" | "pending") || "complete",
        date: dateStr,
        image: getPostImageUrl(safeHeadline, d.topic),
      };
    });

  // Combine uniquely by ID (ensuring all posts display their live post image)
  const idSet = new Set<string>();
  const combined: DraftItem[] = [];

  for (const item of initialItems) {
    if (!idSet.has(item.id)) {
      idSet.add(item.id);
      combined.push(item);
    }
  }

  for (const item of mappedDbItems) {
    if (!idSet.has(item.id)) {
      idSet.add(item.id);
      combined.unshift(item); // Newly generated posts appear at top!
    }
  }

  return <DraftsClient initialDrafts={combined} />;
}
