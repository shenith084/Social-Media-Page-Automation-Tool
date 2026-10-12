import { Metadata } from "next";
import { Search, Filter, Archive, RefreshCcw, CheckSquare } from "lucide-react";

import { db } from "@/lib/db";
import { generationRequests, generationItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Draft Library" };

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "badge-draft" },
  ready: { label: "Ready", cls: "badge-ready" },
  approved: { label: "Approved", cls: "badge-approved" },
  archived: { label: "Archived", cls: "badge-archived" },
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function DraftsPage() {
  // Fetch live generation items from DB
  const items = await db
    .select({
      id: generationItems.id,
      headline: generationItems.headline,
      caption: generationItems.caption,
      status: generationItems.status,
      topic: generationRequests.topic,
      updatedAt: generationItems.updatedAt,
    })
    .from(generationItems)
    .leftJoin(generationRequests, eq(generationItems.requestId, generationRequests.id))
    .orderBy(desc(generationItems.updatedAt));

  return (
    <div style={{ padding: "32px", maxWidth: "1100px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>Draft Library</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            Review, edit and approve generated posts before publishing.
          </p>
        </div>
        <a
          href="/generate"
          id="btn-new-generation"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, rgb(139,92,246), rgb(109,40,217))",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
          }}
        >
          + New Generation
        </a>
      </div>

      {/* Search and filter bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.35)",
            }}
          />
          <input
            id="drafts-search"
            type="search"
            placeholder="Search drafts by topic or captionâ€¦"
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select
            id="drafts-filter-status"
            style={{
              padding: "9px 32px 9px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.875rem",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "rgb(22,22,42)" }}>All statuses</option>
            <option value="draft" style={{ background: "rgb(22,22,42)" }}>Draft</option>
            <option value="ready" style={{ background: "rgb(22,22,42)" }}>Ready</option>
            <option value="approved" style={{ background: "rgb(22,22,42)" }}>Approved</option>
            <option value="archived" style={{ background: "rgb(22,22,42)" }}>Archived</option>
          </select>
          <Filter
            size={14}
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}
          />
        </div>

        {/* Bulk actions (appear when items selected) */}
        <button
          id="btn-bulk-approve"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "8px",
            color: "rgb(74,222,128)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <CheckSquare size={14} />
          Add Selected to Queue
        </button>
      </div>

      {/* Draft cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            No drafts found. Click "+ New Generation" to create some!
          </div>
        )}
        {items.map((draft) => {
          const statusStr = draft.status || "draft";
          const { label, cls } = STATUS_MAP[statusStr] ?? { label: statusStr, cls: "badge-draft" };
          return (
            <div
              key={draft.id}
              id={draft.id}
              className="glass-card-elevated"
              style={{
                padding: "20px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                transition: "border-color 0.2s",
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                id={`check-${draft.id}`}
                style={{
                  width: "16px",
                  height: "16px",
                  marginTop: "2px",
                  accentColor: "rgb(139,92,246)",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />

              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                No image
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{draft.headline || "Untitled"}</h3>
                  <span className={`badge ${cls}`}>{label}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                    {draft.topic} Â· {draft.updatedAt ? formatRelative(draft.updatedAt.toISOString()) : "Just now"}
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                  {(draft.caption || "").length > 160
                    ? (draft.caption || "").slice(0, 157) + "â€¦"
                    : draft.caption || "No caption"}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                <a
                  href={`/drafts/${draft.id}`}
                  id={`btn-edit-${draft.id}`}
                  style={{
                    padding: "6px 14px",
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: "6px",
                    color: "rgb(167,139,250)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Edit / Preview
                </a>
                {draft.status !== "complete" && (
                  <button
                    id={`btn-archive-${draft.id}`}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      justifyContent: "center",
                    }}
                  >
                    <Archive size={12} />
                    Archive
                  </button>
                )}
                {draft.status === "processing" && (
                  <button
                    id={`btn-regenerate-${draft.id}`}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      justifyContent: "center",
                    }}
                  >
                    <RefreshCcw size={12} />
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "24px",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Showing {items.length} of {items.length} drafts
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[1].map((p) => (
            <button
              key={p}
              id={`page-btn-${p}`}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "rgb(167,139,250)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
