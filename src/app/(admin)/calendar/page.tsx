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
    <div style={{ padding: "32px", maxWidth: "1100px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarIcon size={26} style={{ color: "rgb(139,92,246)" }} />
            Publishing Calendar
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            Visual schedule of upcoming posts by date and slot. All times in Europe/London.
          </p>
        </div>
        <Link
          href="/queue"
          className="btn btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          View Full Queue <ChevronRight size={14} />
        </Link>
      </div>

      {calendarDays.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <CalendarIcon size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>No Scheduled Posts in Calendar</h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", maxWidth: "420px", margin: "0 auto 20px" }}>
            Approve drafts from the Draft Library or generate new content to populate upcoming slots.
          </p>
          <Link href="/generate" className="btn btn-primary">
            Generate Content Now
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {calendarDays.map((day) => (
            <div key={day.dateStr} className="glass-card-elevated" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "14px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "rgba(255,255,255,0.9)" }}>
                  {day.displayDate}
                </div>
                <span className="badge badge-queued" style={{ fontSize: "0.75rem" }}>
                  {day.items.length} {day.items.length === 1 ? "post scheduled" : "posts scheduled"}
                </span>
              </div>

              <div style={{ padding: "12px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {day.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "rgba(139,92,246,0.12)",
                            border: "1px solid rgba(139,92,246,0.25)",
                            color: "rgb(196,181,253)",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Clock size={13} />
                          {item.timeDisplay}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.headline}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                            Queue Slot #{item.order}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className={`badge badge-${item.status}`}>
                          {item.status.replace("_", " ")}
                        </span>
                        <Link
                          href="/queue"
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.75rem",
                            textDecoration: "underline",
                          }}
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
