import { Metadata } from "next";
import { GripVertical, Plus, Clock, ListOrdered, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Publishing Queue" };

import { db } from "@/lib/db";
import { queueItems, contentVersions, users } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { QueueRowActions, QueuePauseButton } from "@/components/admin/queue-actions";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  queued: { label: "Queued", bg: "#E0F2FE", text: "#0284C7" },
  publishing: { label: "Publishing...", bg: "#FEF3C7", text: "#D97706" },
  published: { label: "Published", bg: "#DCFCE7", text: "#16A34A" },
  retry_pending: { label: "Retry Pending", bg: "#FEF3C7", text: "#D97706" },
  blocked: { label: "Blocked", bg: "#FEE2E2", text: "#DC2626" },
  needs_review: { label: "Needs Review", bg: "#EDE9FE", text: "#7C3AED" },
  skipped: { label: "Skipped", bg: "#F1F5F9", text: "#475569" },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", text: "#475569" },
};

export default async function QueuePage() {
  const data = await db
    .select({ queueItem: queueItems, contentVersion: contentVersions, user: users })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .leftJoin(users, eq(queueItems.approvedById, users.id))
    .where(inArray(queueItems.status, ["queued", "publishing", "needs_review", "blocked", "retry_pending"]))
    .orderBy(asc(queueItems.queueOrder));

  const QUEUE_ITEMS = data.map((d) => ({
    id: d.queueItem.id,
    draftId: d.queueItem.draftId,
    order: d.queueItem.queueOrder,
    title: d.contentVersion?.headline || "Untitled Post",
    caption: d.contentVersion?.caption || "",
    scheduledAt: d.queueItem.scheduledAt
      ? new Date(d.queueItem.scheduledAt).toLocaleString("en-GB", {
          timeZone: "Europe/London",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Unscheduled",
    status: d.queueItem.status,
    approvedBy: d.user?.name || d.user?.email || "System",
  }));

  const needsReviewCount = QUEUE_ITEMS.filter((i) => i.status === "needs_review").length;

  return (
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
        flexWrap: "wrap",
      }}>
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <ListOrdered size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              Publishing Queue
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Approved posts are assigned times automatically. Europe/London (BST, UTC+1)
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <QueuePauseButton isPaused={false} />
          <Link
            href="/generate"
            id="btn-add-to-queue"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              background: "#4F46E5",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Post
          </Link>
        </div>
      </div>

      {/* Needs review alert */}
      {needsReviewCount > 0 && (
        <div
          id="alert-needs-review"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            background: "#EDE9FE",
            border: "1px solid #DDD6FE",
            borderRadius: "12px",
            marginBottom: "22px",
          }}
        >
          <AlertCircle size={18} color="#7C3AED" />
          <span style={{ fontSize: "0.875rem", color: "#6D28D9", fontWeight: 500 }}>
            {needsReviewCount} post{needsReviewCount > 1 ? "s require" : " requires"} your attention. Visit{" "}
            <Link href="/recovery" style={{ color: "#4F46E5", fontWeight: 700, textDecoration: "underline" }}>
              Recovery
            </Link>{" "}
            to resolve.
          </span>
        </div>
      )}

      {/* Main Container */}
      {QUEUE_ITEMS.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Clock size={28} color="#6366F1" />
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            Queue is empty
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0 0 24px" }}>
            Generate and approve drafts to automatically schedule posts here.
          </p>
          <Link
            href="/generate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 24px",
              background: "#4F46E5",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Generate Content
          </Link>
        </div>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          <table id="queue-table" style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Publishing queue">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["#", "Post", "Scheduled (UK local)", "Status", "Approved by", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 18px",
                      textAlign: i === 0 ? "center" : "left",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.06em",
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
                const { label, bg, text } = STATUS_MAP[item.status] ?? {
                  label: item.status,
                  bg: "#F1F5F9",
                  text: "#475569",
                };

                return (
                  <tr
                    key={item.id}
                    id={item.id}
                    style={{
                      borderBottom: i < QUEUE_ITEMS.length - 1 ? "1px solid #F1F5F9" : "none",
                      background: item.status === "needs_review" ? "#FAF5FF" : "transparent",
                    }}
                  >
                    <td style={{ padding: "16px 18px", textAlign: "center", width: "60px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <GripVertical size={14} color="#94A3B8" style={{ cursor: "grab" }} />
                        <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 600 }}>{item.order}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "3px" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.4 }}>
                        {item.caption.length > 80 ? item.caption.slice(0, 77) + "..." : item.caption}
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0F172A", fontSize: "0.875rem", fontWeight: 500 }}>
                        <Clock size={14} color="#6366F1" />
                        <span>{item.scheduledAt}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <span
                        style={{
                          background: bg,
                          color: text,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          display: "inline-block",
                        }}
                      >
                        {label}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>
                        {item.approvedBy}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <QueueRowActions itemId={item.id} status={item.status} draftId={item.draftId} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

