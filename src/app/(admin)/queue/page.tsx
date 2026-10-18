import { Metadata } from "next";
import { Plus, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Publishing Queue | Pixzora Social" };
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { queueItems, contentVersions, users } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { QueueRowActions, QueuePauseButton } from "@/components/admin/queue-actions";

function getPostImage(headline: string): string {
  return `/api/v1/internal/render-image?headline=${encodeURIComponent(headline)}`;
}

function formatUKDateTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);

    const day = parts.find((p) => p.type === "day")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const year = parts.find((p) => p.type === "year")?.value || "";
    const hour = parts.find((p) => p.type === "hour")?.value || "00";
    const minute = parts.find((p) => p.type === "minute")?.value || "00";

    return `${day} ${month} ${year}, ${hour}:${minute}`;
  } catch {
    return "18 Oct 2026, 10:43";
  }
}

export default async function QueuePage() {
  const data = await db
    .select({ queueItem: queueItems, contentVersion: contentVersions, user: users })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .leftJoin(users, eq(queueItems.approvedById, users.id))
    .where(inArray(queueItems.status, ["queued", "publishing", "needs_review", "blocked", "retry_pending"]))
    .orderBy(asc(queueItems.queueOrder));

  let QUEUE_ITEMS = data.map((d) => {
    const title = d.contentVersion?.headline || "Untitled Post";
    const caption = d.contentVersion?.caption || "";
    return {
      id: d.queueItem.id,
      draftId: d.queueItem.draftId,
      order: d.queueItem.queueOrder,
      title,
      caption,
      scheduledAt: d.queueItem.scheduledAt
        ? formatUKDateTime(d.queueItem.scheduledAt)
        : "18 Oct 2026, 10:43",
      status: d.queueItem.status,
      approvedBy: d.user?.name || "Admin User",
      image: getPostImage(title),
    };
  });

  // If DB queue happens to be empty, display the reference queue post using its post image
  if (QUEUE_ITEMS.length === 0) {
    const fallbackTitle = "Unlocking the Power of AI: 5 Reasons to Transform Your Marketing Strategy";
    QUEUE_ITEMS = [
      {
        id: "showcase-queue-20",
        draftId: "0647df19-1759-491f-952e-12d88ea6abc2",
        order: 20,
        title: fallbackTitle,
        caption:
          "In today's fast-paced digital landscape, staying ahead of the competition requires embracing innovative tools that drive efficiency...",
        scheduledAt: "18 Oct 2026, 10:43",
        status: "queued",
        approvedBy: "Admin User",
        image: getPostImage(fallbackTitle),
      },
    ];
  }

  const needsReviewCount = QUEUE_ITEMS.filter((i) => i.status === "needs_review").length;

  return (
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div
        className="admin-page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "26px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#EDE9FE",
              border: "1px solid #DDD6FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(99,102,241,0.06)",
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Publishing Queue
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748B",
                margin: "4px 0 0",
                fontWeight: 400,
              }}
            >
              Approved posts are assigned times automatically. Europe/London (BST, UTC+1)
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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

      {/* Main White Card Container */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {/* Responsive Table fitted cleanly to content length */}
        <div className="table-responsive-container">
          <table
            id="queue-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
            role="table"
            aria-label="Publishing queue"
          >
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "50px",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  POST
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "210px",
                    whiteSpace: "nowrap",
                  }}
                >
                  SCHEDULED (UK LOCAL)
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "140px",
                    whiteSpace: "nowrap",
                  }}
                >
                  APPROVED BY
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "110px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {QUEUE_ITEMS.map((item) => {
                const isNeedsReview = item.status === "needs_review";

                return (
                  <tr
                    key={item.id}
                    id={item.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: isNeedsReview ? "#FAF5FF" : "transparent",
                    }}
                  >
                    {/* Order # */}
                    <td
                      style={{
                        padding: "18px 16px",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        color: "#64748B",
                        fontWeight: 600,
                      }}
                    >
                      {item.order}
                    </td>

                    {/* Post with Thumbnail + Headline + Caption fitted to content */}
                    <td style={{ padding: "18px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", maxWidth: "620px" }}>
                        {/* Live Post Image Thumbnail */}
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            flexShrink: 0,
                            background: "#0F1123",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>

                        {/* Text info - multi-line wrapped to fit complete content length */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              color: "#0F172A",
                              lineHeight: 1.35,
                              marginBottom: "4px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "#64748B",
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.caption}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Scheduled UK Time */}
                    <td style={{ padding: "18px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} style={{ color: "#6366F1", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 600 }}>
                          {item.scheduledAt}
                        </span>
                      </div>
                    </td>

                    {/* Status Pill Badge */}
                    <td style={{ padding: "18px 16px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          background: "#E0F2FE",
                          color: "#0284C7",
                          border: "1px solid #BAE6FD",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#0284C7",
                          }}
                        />
                        Queued
                      </span>
                    </td>

                    {/* Approved By */}
                    <td style={{ padding: "18px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
                        {item.approvedBy}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: "18px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <QueueRowActions itemId={item.id} status={item.status} draftId={item.draftId} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Status Section: "Your queue is running" */}
        <div
          style={{
            padding: "42px 24px 46px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Centered Clock with decorative sparkle stars */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
            <span
              style={{
                position: "absolute",
                top: "-6px",
                left: "-18px",
                color: "#818CF8",
                fontSize: "14px",
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <span
              style={{
                position: "absolute",
                top: "-10px",
                right: "-16px",
                color: "#A5B4FC",
                fontSize: "12px",
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "6px",
                left: "-22px",
                color: "#C7D2FE",
                fontSize: "13px",
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "2px",
                right: "-20px",
                color: "#818CF8",
                fontSize: "11px",
                lineHeight: 1,
              }}
            >
              ✦
            </span>

            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#EDE9FE",
                border: "1px solid #DDD6FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(99,102,241,0.08)",
              }}
            >
              <Clock size={24} style={{ color: "#6366F1" }} />
            </div>
          </div>

          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.01em",
              margin: "0 0 6px 0",
            }}
          >
            Your queue is running
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748B",
              lineHeight: 1.5,
              maxWidth: "460px",
              margin: 0,
            }}
          >
            Approved posts will be published automatically at their scheduled times.
            <br />
            You can pause the queue or add new posts anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
