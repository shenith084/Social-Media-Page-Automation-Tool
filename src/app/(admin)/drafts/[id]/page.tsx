import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Archive, Sparkles, Clock, Hash } from "lucide-react";
import { db } from "@/lib/db";
import { generationItems, generationRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { approveAndQueueAction } from "@/app/actions/queue";
import { archiveDraftAction } from "@/app/actions/draft-detail";

export const metadata: Metadata = { title: "Review Draft" };
export const dynamic = "force-dynamic";

export default async function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db
    .select({ item: generationItems, topic: generationRequests.topic, requestedAt: generationRequests.createdAt })
    .from(generationItems)
    .leftJoin(generationRequests, eq(generationItems.requestId, generationRequests.id))
    .where(eq(generationItems.id, id))
    .limit(1);

  if (!items || items.length === 0) notFound();
  const { item, topic, requestedAt } = items[0];
  const isActive = item.status !== "failed";

  const imagePreviewUrl = item.headline
    ? `/api/v1/internal/render-image?headline=${encodeURIComponent(item.headline)}`
    : null;

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }} className="animate-fade-in">
      <Link href="/drafts" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "24px" }}>
        <ArrowLeft size={16} /> Back to Draft Library
      </Link>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px" }}>{item.headline || "Untitled Draft"}</h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: "rgba(139,92,246,0.15)", color: "rgb(167,139,250)", border: "1px solid rgba(139,92,246,0.3)", textTransform: "capitalize" }}>
              {item.status}
            </span>
            {topic && <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>Topic: {topic}</span>}
            {requestedAt && <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} />{new Date(requestedAt).toLocaleDateString("en-GB")}</span>}
          </div>
        </div>
        {isActive && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <form action={async () => { "use server"; await approveAndQueueAction(item.id); }}>
              <button type="submit" id="btn-approve-queue" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(135deg, rgb(34,197,94), rgb(22,163,74))", border: "none", borderRadius: "8px", color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(34,197,94,0.35)" }}>
                <CheckCircle2 size={16} /> Approve &amp; Queue
              </button>
            </form>
            <form action={async () => { "use server"; await archiveDraftAction(item.id); }}>
              <button type="submit" id="btn-archive-draft" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}>
                <Archive size={15} /> Archive
              </button>
            </form>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="glass-card-elevated" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <Sparkles size={13} style={{ color: "rgb(139,92,246)" }} /> Caption
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
              {item.caption || "No caption generated."}
            </p>
          </div>

          {item.hashtags && Array.isArray(item.hashtags) && (item.hashtags as string[]).length > 0 && (
            <div className="glass-card-elevated" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <Hash size={13} style={{ color: "rgb(59,130,246)" }} /> Hashtags
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(item.hashtags as string[]).map((tag, i) => (
                  <span key={i} style={{ padding: "4px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", fontSize: "0.8125rem", color: "rgb(147,197,253)" }}>#{tag.replace(/^#/, "")}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glass-card-elevated" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Image Preview</h2>
            {imagePreviewUrl ? (
              <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={imagePreviewUrl} alt="Post image preview" style={{ width: "100%", display: "block" }} />
              </div>
            ) : (
              <div style={{ height: "160px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.8125rem" }}>No image</div>
            )}
          </div>
          <div className="glass-card-elevated" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Status", value: item.status },
                { label: "Position", value: `#${item.position || 1}` },
                { label: "Created", value: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}