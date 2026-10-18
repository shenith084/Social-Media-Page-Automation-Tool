import { Metadata } from "next";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { queueItems, contentVersions } from "@/lib/db/schema";
import { asc, inArray, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Publishing Calendar" };
export const dynamic = "force-dynamic";

interface CalendarGroup {
  dateStr: string;
  displayDate: string;
  items: {
    id: string;
    headline: string;
    scheduledAt: Date;
    timeDisplay: string;
    status: string;
    order: number;
  }[];
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  queued: { label: "Queued", bg: "#E0F2FE", text: "#0284C7" },
  publishing: { label: "Publishing...", bg: "#FEF3C7", text: "#D97706" },
  published: { label: "Published", bg: "#DCFCE7", text: "#16A34A" },
  retry_pending: { label: "Retry Pending", bg: "#FEF3C7", text: "#D97706" },
  blocked: { label: "Blocked", bg: "#FEE2E2", text: "#DC2626" },
  needs_review: { label: "Needs Review", bg: "#EDE9FE", text: "#7C3AED" },
};

export default async function CalendarPage() {
  const activeJobs = await db
    .select({
      queueItem: queueItems,
      contentVersion: contentVersions,
    })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .where(inArray(queueItems.status, ["queued", "publishing", "needs_review", "blocked", "retry_pending"]))
    .orderBy(asc(queueItems.scheduledAt));

  const groupsMap = new Map<string, CalendarGroup>();

  for (const job of activeJobs) {
    if (!job.queueItem.scheduledAt) continue;
    const dateObj = new Date(job.queueItem.scheduledAt);
    
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dateObj);

    const displayDate = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(dateObj);

    const timeDisplay = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, {
        dateStr: dateKey,
        displayDate,
        items: [],
      });
    }

    groupsMap.get(dateKey)!.items.push({
      id: job.queueItem.id,
      headline: job.contentVersion?.headline || "Untitled Scheduled Post",
      scheduledAt: dateObj,
      timeDisplay,
      status: job.queueItem.status,
      order: job.queueItem.queueOrder,
    });
  }

  const calendarDays = Array.from(groupsMap.values());

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
            <CalendarIcon size={24} color="#6366F1" />
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
              Publishing Calendar
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Visual schedule of upcoming posts by date and slot. All times in Europe/London.
            </p>
          </div>
        </div>

        {/* Right Action */}
        <Link
          href="/queue"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            color: "#0F172A",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          View Full Queue <ChevronRight size={15} color="#6366F1" />
        </Link>
      </div>

      {/* Main Content */}
      {calendarDays.length === 0 ? (
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
            <CalendarIcon size={28} color="#6366F1" />
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            No Scheduled Posts in Calendar
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0 auto 24px", maxWidth: "420px" }}>
            Approve drafts from the Draft Library or generate new content to populate upcoming slots.
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
            Generate Content Now
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {calendarDays.map((day) => (
            <div
              key={day.dateStr}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              {/* Day Header Bar */}
              <div
                style={{
                  padding: "14px 22px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0F172A" }}>
                  {day.displayDate}
                </div>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0284C7",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "9999px",
                  }}
                >
                  {day.items.length} {day.items.length === 1 ? "post scheduled" : "posts scheduled"}
                </span>
              </div>

              {/* Day Items */}
              <div style={{ padding: "16px 22px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {day.items.map((item) => {
                    const statusObj = STATUS_MAP[item.status] ?? {
                      label: item.status,
                      bg: "#F1F5F9",
                      text: "#475569",
                    };

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          gap: "16px",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "#EEF2FF",
                              color: "#4F46E5",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Clock size={13} color="#6366F1" />
                            {item.timeDisplay}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "0.9375rem",
                                color: "#0F172A",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.headline}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                              Queue Slot #{item.order}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              background: statusObj.bg,
                              color: statusObj.text,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: "9999px",
                            }}
                          >
                            {statusObj.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

