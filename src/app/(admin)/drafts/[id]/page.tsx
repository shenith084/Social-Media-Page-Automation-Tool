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
    <div style={{ padding: "32px", maxWidth: "1050px" }} className="animate-fade-in">
      <Link
        href="/drafts"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "rgba(255,255,255,0.5)",
          textDecoration: "none",
          fontSize: "0.875rem",
          marginBottom: "24px",
        }}
      >
        <ArrowLeft size={16} /> Back to Draft Library
      </Link>

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