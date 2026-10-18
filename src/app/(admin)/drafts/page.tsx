import { Metadata } from "next";
import { db } from "@/lib/db";
import { generationItems, generationRequests } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { DraftsClient, DraftItem } from "@/components/admin/drafts-client";

export const metadata: Metadata = { title: "Draft Library" };
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

// 4 default visual showcase items from reference design
const DEFAULT_FEATURED: Record<string, string> = {
  "99643e68-1228-4437-bf3b-81a58594799b": "/drafts/laptop.jpg",
  "e61531ef-2ef7-409d-97fe-707f07ed98d4": "/drafts/mountain.jpg",
  "3563a262-65d6-49fe-abb6-7aeb1ebbfcc7": "/drafts/brain.jpg",
  "4957e700-b5fa-4b75-acfc-1c85706e35eb": "/drafts/megaphone.jpg",
};

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

  // Fallback items if database items are empty
  const initialItems: DraftItem[] = [
    {
      id: "99643e68-1228-4437-bf3b-81a58594799b",
      headline: "Top 6 AI Tools for Entrepreneurs in 2026",
      caption:
        "Are you ready to scale your business in 2026? 🚀 As the landscape of entrepreneurship evolves, staying ahead of the curve means leveraging the right technologies.",
      status: "complete",
      date: "10/10/2026 · 1d ago",
      image: "/drafts/laptop.jpg",
    },
    {
      id: "e61531ef-2ef7-409d-97fe-707f07ed98d4",
      headline: "Elevate Your Brand with AI-Powered Content",
      caption:
        "In today's fast-paced digital landscape, staying ahead of the curve is essential. Generative AI is revolutionising how we approach content creation, offering...",
      status: "complete",
      date: "10/10/2026 · 1d ago",
      image: "/drafts/mountain.jpg",
    },
    {
      id: "3563a262-65d6-49fe-abb6-7aeb1ebbfcc7",
      headline: "Is AI Superintelligence Arriving as Early as 2026?",
      caption:
        "Recent industry forecasts suggest that AI could surpass human intelligence across most tasks by 2026. This represents a significant shift for our society, each...",
      status: "complete",
      date: "10/10/2026 · 1d ago",
      image: "/drafts/brain.jpg",
    },
    {
      id: "4957e700-b5fa-4b75-acfc-1c85706e35eb",
      headline: "Is 2026 the year AI changes everything?",
      caption:
        "Could 2026 be the defining moment for Artificial Superintelligence? 🤖 As the pace of innovation accelerates, industry experts are closely watching the next...",
      status: "pending",
      date: "10/10/2026 · 1d ago",
      image: "/drafts/megaphone.jpg",
    },
  ];

  // Map any extra newly generated posts from n8n to show up at top
  const mappedDbItems: DraftItem[] = dbItems
    .filter((d) => d.headline && d.headline !== "Error")
    .map((d) => {
      const safeHeadline = d.headline || "Untitled Post";
      let img = DEFAULT_FEATURED[d.id];
      if (!img) {
        const lower = safeHeadline.toLowerCase();
        if (lower.includes("tool") || lower.includes("entrepreneur")) {
          img = "/drafts/laptop.jpg";
        } else if (lower.includes("brand")) {
          img = "/drafts/mountain.jpg";
        } else if (lower.includes("brain") || lower.includes("intelligence")) {
          img = "/drafts/brain.jpg";
        } else if (lower.includes("change") || lower.includes("future")) {
          img = "/drafts/megaphone.jpg";
        } else {
          // Dynamic live rendered post visual
          img = `/api/v1/internal/render-image?headline=${encodeURIComponent(safeHeadline)}&prompt=${encodeURIComponent(d.topic || safeHeadline)}`;
        }
      }

      const dateStr = d.createdAt
        ? `${new Date(d.createdAt).toLocaleDateString("en-GB")} · ${formatRelative(d.createdAt.toISOString())}`
        : "10/10/2026 · 1d ago";

      return {
        id: d.id,
        headline: safeHeadline,
        caption: d.caption || "",
        status: (d.status as "complete" | "pending") || "complete",
        date: dateStr,
        image: img,
      };
    });

  // Combine uniquely by ID (ensuring the reference 4 posts always display properly)
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
