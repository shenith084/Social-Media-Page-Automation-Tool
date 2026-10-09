import { db } from "@/lib/db";
import { generationItems, generationRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Image as ImageIcon, Check, ArrowLeft } from "lucide-react";
import { approveAndQueueAction } from "@/app/actions/queue";

export default async function DraftPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const itemData = await db
    .select({
      item: generationItems,
      topic: generationRequests.topic,
    })
    .from(generationItems)
    .leftJoin(generationRequests, eq(generationItems.requestId, generationRequests.id))
    .where(eq(generationItems.id, id))
    .limit(1);

  if (!itemData || itemData.length === 0) {
    notFound();
  }

  const { item, topic } = itemData[0];

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="/drafts" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <ArrowLeft size={16} /> Back
        </a>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Review Draft</h1>
      </div>

      <div className="glass-card-elevated" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Top Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              Topic
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 500 }}>{topic || "General"}</div>
          </div>
          <div>
             <span className={`badge badge-${item.status === "failed" ? "blocked" : "ready"}`}>
               {item.status}
             </span>
          </div>
        </div>

        {/* Content */}
        <div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Headline
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "white" }}>
            {item.headline || "No headline generated"}
          </h2>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Caption / Body
          </div>
          <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {item.caption || "No caption generated"}
          </div>
        </div>

        {item.hashtags && Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Hashtags
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {item.hashtags.map((tag, idx) => (
                <span key={idx} style={{ color: "rgb(139,92,246)", fontSize: "0.875rem", fontWeight: 500 }}>
                  #{tag.replace("#", "")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview / Generation */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Visual Asset
          </div>
          {/* Live Dynamic Image Rendered by Sharp (Workflow 04) */}
          <div 
            style={{ 
              width: "100%", 
              maxWidth: "500px",
              aspectRatio: "1/1",
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/api/v1/internal/render-image?headline=${encodeURIComponent(item.headline || "New Post")}`} 
              alt="Generated Visual Asset"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
             <button
                style={{
                  padding: "8px 16px",
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  borderRadius: "6px",
                  color: "rgb(167,139,250)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Regenerate AI Background
              </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
          <button
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
          
          <form action={async () => {
            "use server";
            await approveAndQueueAction(item.id);
            redirect("/queue");
          }}>
            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "linear-gradient(135deg, rgb(34,197,94), rgb(21,128,61))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Check size={16} /> Approve & Queue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
