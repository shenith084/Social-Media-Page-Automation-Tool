import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { generationItems, generationRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DraftEditor } from "@/components/admin/draft-editor";

export const metadata: Metadata = { title: "Review & Edit Draft" };
export const dynamic = "force-dynamic";

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await db
    .select({
      item: generationItems,
      topic: generationRequests.topic,
    })
    .from(generationItems)
    .leftJoin(
      generationRequests,
      eq(generationItems.requestId, generationRequests.id)
    )
    .where(eq(generationItems.id, id))
    .limit(1);

  if (!items || items.length === 0) notFound();
  const { item, topic } = items[0];

  return (
    <div style={{ padding: "26px 36px 40px", maxWidth: "1280px" }}>
      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/drafts"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#4F46E5",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "8px",
            background: "white",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={16} />
          Back to Draft Library
        </Link>
      </div>

      <DraftEditor
        itemId={item.id}
        initialHeadline={item.headline || ""}
        initialCaption={item.caption || ""}
        initialHashtags={(item.hashtags as string[]) || []}
        status={item.status}
        topic={topic}
      />
    </div>
  );
}
