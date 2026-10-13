import { Metadata } from "next";
import {
  Sparkles,
  ListOrdered,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  queueItems,
  publishedPosts,
  auditLogs,
  pages,
  pageConnections,
  systemHeartbeats,
  contentVersions,
} from "@/lib/db/schema";
import { desc, asc, eq, sql, gt } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";
import { ManualDispatchButton } from "@/components/admin/dispatch-button";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const statusBadgeMap: Record<string, string> = {
  queued: "badge-queued",
  publishing: "badge-publishing",
  published: "badge-published",
  needs_review: "badge-needs-review",
  blocked: "badge-blocked",
};

const activityColour: Record<string, string> = {
  success: "34,197,94",
  info: "59,130,246",
  warning: "234,179,8",
  error: "239,68,68",
};

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallelised DB queries for sub-second execution
  const [
    activeQueueData,
    publishedTodayCount,
    failuresCount,
    recentLogs,
    activePageData,
    heartbeat,
  ] = await Promise.all([
    // 1. Active queue
    db
      .select({
        queueItem: queueItems,
        contentVersion: contentVersions,
      })
      .from(queueItems)
      .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
      .where(eq(queueItems.status, "queued"))
      .orderBy(asc(queueItems.scheduledAt))
      .limit(10),

    // 2. Published today count
    db
      .select({ count: sql<number>`count(*)` })
      .from(publishedPosts)
      .where(gt(publishedPosts.actualPublishedAt, today)),

    // 3. Failures count
    db
      .select({ count: sql<number>`count(*)` })
      .from(queueItems)
      .where(eq(queueItems.status, "needs_review")),

    // 4. Recent activity
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(5),

    // 5. Active page connection
    db
      .select({
        page: pages,
        connection: pageConnections,
      })
      .from(pages)
      .leftJoin(pageConnections, eq(pages.id, pageConnections.pageId))
      .where(eq(pages.isActive, true))
      .limit(1),

    // 6. System heartbeat
    db
      .select()
      .from(systemHeartbeats)
      .where(eq(systemHeartbeats.component, "n8n-scheduler"))
      .orderBy(desc(systemHeartbeats.lastHeartbeatAt))
      .limit(1),
  ]);

  const activeQueue = activeQueueData.map((q) => ({
    ...q.queueItem,
    contentVersion: q.contentVersion,
  }));

  const nextPost = activeQueue[0];

  const stats = [
    {
      id: "stat-next-post",
      label: "Next Post",
      value: nextPost ? format(nextPost.scheduledAt, "MMM d, HH:mm") : "None",
      subValue: nextPost ? "Scheduled" : "Queue empty",
      icon: Clock,
      colour: "139,92,246",
      trend: null,
    },
    {
      id: "stat-queue-coverage",
      label: "Queue Coverage",
      value: `${activeQueue.length} posts`,
      subValue: "Currently in queue",
      icon: ListOrdered,
      colour: "59,130,246",
      trend: null,
    },
    {
      id: "stat-published-today",
      label: "Published Today",
      value: publishedTodayCount[0]?.count?.toString() || "0",
      subValue: "Since midnight UTC",
      icon: CheckCircle2,
      colour: "34,197,94",
      trend: null,
    },
    {
      id: "stat-failures",
      label: "Action Required",
      value: failuresCount[0]?.count?.toString() || "0",
      subValue: "Needs review",
      icon: AlertTriangle,
      colour: failuresCount[0]?.count > 0 ? "239,68,68" : "234,179,8",
      trend: null,
    },
  ];

  const recentActivity = recentLogs.map((log) => ({
    id: log.id,
    text: log.action,
    time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
    type:
      log.action.toLowerCase().includes("fail") ||
      log.action.toLowerCase().includes("error")
        ? "error"
        : "info",
  }));

  const connection = activePageData[0]?.connection;
  const isConnected = connection?.status === "connected";
  const tokenExpiresAt = connection?.tokenExpiresAt;

  const latestHeartbeat = heartbeat[0];
  const isSchedulerRunning = latestHeartbeat
    ? new Date().getTime() - new Date(latestHeartbeat.lastHeartbeatAt).getTime() <
      5 * 60 * 1000
    : false;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }} className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>
            Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <ManualDispatchButton />
          <a
            href="/generate"
            id="btn-quick-generate"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "linear-gradient(135deg, rgb(139,92,246), rgb(109,40,217))",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          <Sparkles size={16} />
          Generate Content
        </a>
        </div>
      </div>

      {/* Connection & scheduler status banner */}
      <div
        id="banner-system-health"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderRadius: "10px",
          marginBottom: "28px",
          background: isConnected
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(239, 68, 68, 0.08)",
          border: isConnected
            ? "1px solid rgba(34, 197, 94, 0.25)"
            : "1px solid rgba(239, 68, 68, 0.25)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Wifi
            size={16}
            style={{ color: isConnected ? "rgb(34,197,94)" : "rgb(239,68,68)" }}
          />
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {isConnected ? (
              <>
                Facebook Page: <strong>{activePageData[0]?.page.name || "Viral reels"}</strong> Connected
                <span
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    marginLeft: "8px",
                    fontSize: "0.8125rem",
                  }}
                >
                  Token: Never Expires
                </span>
              </>
            ) : (
              <>
                Facebook Page Disconnected &mdash;{" "}
                <a
                  href="/settings"
                  style={{ color: "rgb(239,68,68)", textDecoration: "underline" }}
                >
                  Reconnect now
                </a>
              </>
            )}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isSchedulerRunning
                ? "rgb(34, 197, 94)"
                : "rgb(234, 179, 8)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Scheduler: {isSchedulerRunning ? "Active" : "Standing By (1-min cron)"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        id="kpi-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              id={stat.id}
              className="glass-card-elevated"
              style={{ padding: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {stat.label}
                </span>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: `rgba(${stat.colour}, 0.12)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: `rgb(${stat.colour})` }} />
                </div>
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {stat.subValue}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Queue & Recent Activity side-by-side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Next Posts Preview */}
        <div className="glass-card-elevated" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Upcoming Posts</h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.45)",
                  marginTop: "2px",
                }}
              >
                Next posts scheduled in publishing queue
              </p>
            </div>
            <a
              href="/queue"
              style={{
                fontSize: "0.8125rem",
                color: "rgb(139,92,246)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              View all &rarr;
            </a>
          </div>

          {activeQueue.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <Clock
                size={36}
                style={{ margin: "0 auto 12px", opacity: 0.4 }}
              />
              <p style={{ fontWeight: 500, marginBottom: "4px" }}>
                Queue is empty
              </p>
              <p style={{ fontSize: "0.8125rem" }}>
                Generate drafts and approve them to schedule publication.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeQueue.map((item, idx) => (
                <div
                  key={item.id}
                  id={`queue-preview-item-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(139,92,246,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "rgb(196,181,253)",
                      flexShrink: 0,
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.contentVersion?.headline || "Untitled Post"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.4)",
                        marginTop: "2px",
                      }}
                    >
                      {item.scheduledAt
                        ? format(new Date(item.scheduledAt), "EEE d MMM, HH:mm")
                        : "Slot pending"}
                    </div>
                  </div>
                  <span
                    className={`badge ${statusBadgeMap[item.status] || "badge-queued"}`}
                    style={{ flexShrink: 0 }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass-card-elevated" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Recent Activity</h2>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.45)",
                marginTop: "2px",
              }}
            >
              Latest audit events
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {recentActivity.length === 0 ? (
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.35)",
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                No recent activity.
              </p>
            ) : (
              recentActivity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: `rgb(${activityColour[act.type] || "59,130,246"})`,
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {act.text}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        color: "rgba(255,255,255,0.35)",
                        marginTop: "2px",
                      }}
                    >
                      {act.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
