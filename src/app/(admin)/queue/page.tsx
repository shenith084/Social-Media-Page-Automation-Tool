import { Metadata } from "next";
import {
  GripVertical,
  Pause,
  Play,
  Trash2,
  Eye,
  Clock,
  PlusCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Publishing Queue" };

import { db } from "@/lib/db";
import { queueItems, contentVersions, users } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "badge-queued" },
  publishing: { label: "Publishing…", cls: "badge-publishing" },
  published: { label: "Published", cls: "badge-published" },
  retry_pending: { label: "Retry Pending", cls: "badge-retry" },
  blocked: { label: "Blocked", cls: "badge-blocked" },
  needs_review: { label: "Needs Review", cls: "badge-needs-review" },
  skipped: { label: "Skipped", cls: "badge-skipped" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled" },
};

export default async function QueuePage() {
  const data = await db
    .select({
      queueItem: queueItems,
      contentVersion: contentVersions,
      user: users,
    })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .leftJoin(users, eq(queueItems.approvedById, users.id))
    .where(inArray(queueItems.status, ["queued", "publishing", "needs_review", "blocked", "retry_pending"]))
    .orderBy(asc(queueItems.queueOrder));

  const QUEUE_ITEMS = data.map((d) => ({
    id: d.queueItem.id,
    order: d.queueItem.queueOrder,
    title: d.contentVersion?.headline || "Untitled",
    caption: d.contentVersion?.caption || "",
    scheduledAt: d.queueItem.scheduledAt ? new Date(d.queueItem.scheduledAt).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" }) : "Unscheduled",
    status: d.queueItem.status,
    approvedBy: d.user?.name || d.user?.email || "System",
  }));

  return (
    <div style={{ padding: "32px", maxWidth: "1100px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>Publishing Queue</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            Approved posts are assigned times automatically. Europe/London (BST, UTC+1)
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            id="btn-pause-queue"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: "8px",
              color: "rgb(234,179,8)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Pause size={14} />
            Pause Queue
          </button>
          <a
            href="/drafts"
            id="btn-add-to-queue"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
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
            <PlusCircle size={14} />
            Add Posts
          </a>
        </div>
      </div>

      {/* Alert for needs_review */}
      <div
        id="alert-needs-review"
        style={{
          display: "flex",
          gap: "10px",
          padding: "12px 16px",
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "0.875rem", color: "rgba(167,139,250,0.9)" }}>
          ⚠ 1 post requires your attention — timeout occurred. Visit{" "}
          <a href="/recovery" style={{ color: "rgb(167,139,250)" }}>Recovery</a> to resolve.
        </span>
      </div>

      {/* Queue table */}
      <div className="glass-card-elevated" style={{ overflow: "hidden" }}>
        <table
          id="queue-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
          role="table"
          aria-label="Publishing queue"
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#", "Post", "Scheduled (UK local)", "Status", "Approved by", "Actions"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: i === 0 ? "center" : "left",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUEUE_ITEMS.map((item, i) => {
              const { label, cls } = STATUS_MAP[item.status] ?? { label: item.status, cls: "badge-queued" };
              return (
                <tr
                  key={item.id}
                  id={item.id}
                  style={{
                    borderBottom: i < QUEUE_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: item.status === "needs_review"
                      ? "rgba(139,92,246,0.04)"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Order / Drag handle */}
                  <td style={{ padding: "14px 16px", textAlign: "center", width: "60px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                      <GripVertical
                        size={14}
                        style={{ color: "rgba(255,255,255,0.2)", cursor: "grab" }}
                      />
                      <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
                        {item.order}
                      </span>
                    </div>
                  </td>

                  {/* Post info */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", marginBottom: "2px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                      {item.caption.length > 70
                        ? item.caption.slice(0, 67) + "…"
                        : item.caption}
                    </div>
                  </td>

                  {/* Scheduled time */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span style={{ fontSize: "0.875rem" }}>{item.scheduledAt}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${cls}`}>{label}</span>
                  </td>

                  {/* Approved by */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
                      {item.approvedBy}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        id={`btn-preview-${item.id}`}
                        title="Preview"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Eye size={13} />
                      </button>
                      {item.status === "queued" && (
                        <button
                          id={`btn-remove-${item.id}`}
                          title="Remove from queue (keeps draft)"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "rgba(239,68,68,0.7)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      {item.status === "needs_review" && (
                        <a
                          href="/recovery"
                          id={`btn-resolve-${item.id}`}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.3)",
                            color: "rgb(167,139,250)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Resolve
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "20px",
          padding: "14px 16px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.05)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "rgba(255,255,255,0.5)" }}>How times are assigned:</strong> The system
        assigns the next available slot based on your schedule settings (fixed slots or interval mode).
        Drag rows to reorder — upcoming unclaimed posts will be rescheduled accordingly.
        Removing a post from the queue cancels publication but keeps the draft.
      </div>
    </div>
  );
}
