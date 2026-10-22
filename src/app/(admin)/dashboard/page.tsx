import { Metadata } from "next";
import {
  ListOrdered,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
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

export const metadata: Metadata = { title: "Dashboard | AutoSocial" };
export const dynamic = "force-dynamic";

const statusBadgeMap: Record<string, string> = {
  queued: "badge-queued",
  publishing: "badge-publishing",
  published: "badge-published",
  needs_review: "badge-needs-review",
  blocked: "badge-blocked",
};

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeQueueData,
    publishedTodayCount,
    failuresCount,
    recentLogs,
    activePageData,
    heartbeat,
  ] = await Promise.all([
    db
      .select({ queueItem: queueItems, contentVersion: contentVersions })
      .from(queueItems)
      .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
      .where(eq(queueItems.status, "queued"))
      .orderBy(asc(queueItems.scheduledAt))
      .limit(10),
    db.select({ count: sql<number>`count(*)` }).from(publishedPosts).where(gt(publishedPosts.actualPublishedAt, today)),
    db.select({ count: sql<number>`count(*)` }).from(queueItems).where(eq(queueItems.status, "needs_review")),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
    db
      .select({ page: pages, connection: pageConnections })
      .from(pages)
      .leftJoin(pageConnections, eq(pages.id, pageConnections.pageId))
      .where(eq(pages.isActive, true))
      .limit(1),
    db.select().from(systemHeartbeats).where(eq(systemHeartbeats.component, "n8n-scheduler")).orderBy(desc(systemHeartbeats.lastHeartbeatAt)).limit(1),
  ]);

  const activeQueue = activeQueueData.map((q) => ({ ...q.queueItem, contentVersion: q.contentVersion }));
  const nextPost = activeQueue[0];
  const page = activePageData[0]?.page;
  const connection = activePageData[0]?.connection;
  const isConnected = connection?.status === "connected";
  const tokenExpiresAt = connection?.tokenExpiresAt;
  const latestHeartbeat = heartbeat[0];
  const isSchedulerRunning = latestHeartbeat
    ? new Date().getTime() - new Date(latestHeartbeat.lastHeartbeatAt).getTime() < 5 * 60 * 1000
    : false;

  const stats = [
    {
      id: "stat-next-post",
      label: "Next Post",
      value: nextPost ? format(nextPost.scheduledAt, "HH:mm") : "None",
      subValue: nextPost ? "Scheduled" : "Queue empty",
      icon: Clock,
      iconBg: "#EEF2FF",
      iconColor: "#6366F1",
      border: "#E0E7FF",
    },
    {
      id: "stat-queue-coverage",
      label: "Queue Coverage",
      value: `${activeQueue.length} posts`,
      subValue: "Currently in queue",
      icon: ListOrdered,
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      border: "#DBEAFE",
    },
    {
      id: "stat-published-today",
      label: "Published Today",
      value: publishedTodayCount[0]?.count?.toString() ?? "0",
      subValue: "Since midnight UTC",
      icon: CheckCircle2,
      iconBg: "#F0FDF4",
      iconColor: "#22C55E",
      border: "#DCFCE7",
    },
    {
      id: "stat-failures",
      label: "Action Required",
      value: failuresCount[0]?.count?.toString() ?? "0",
      subValue: "Needs review",
      icon: AlertTriangle,
      iconBg: "#FFFBEB",
      iconColor: "#F59E0B",
      border: "#FDE68A",
    },
  ];

  const recentActivity = recentLogs.map((log) => ({
    id: log.id,
    text: log.action,
    time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
    isError: log.action.toLowerCase().includes("fail") || log.action.toLowerCase().includes("error"),
  }));

  const schedulerLabel = isSchedulerRunning ? "Running" : "Standing By (1-min cron)";

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div
        className="admin-page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: "4px",
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: 400, margin: 0 }}>
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>

        <div className="admin-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ManualDispatchButton />
          <a
            href="/generate"
            id="btn-quick-generate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 18px",
              background: "linear-gradient(135deg, #7C3AED, #6366F1)",
              borderRadius: "10px",
              color: "white",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
              transition: "opacity 0.15s ease",
            }}
          >
            <Sparkles size={15} />
            Generate Content
          </a>
        </div>
      </div>

      {/* Facebook Status Banner */}
      <div
        className="status-banner-responsive"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px 20px",
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Facebook icon & Page name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#1877F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: 500 }}>
              Page:
            </span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>
              {page?.name ?? "Viral reels"}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                borderRadius: "999px",
                background: isConnected ? "#ECFDF5" : "#FEF2F2",
                color: isConnected ? "#047857" : "#B91C1C",
                border: `1px solid ${isConnected ? "#A7F3D0" : "#FECACA"}`,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isConnected ? "#10B981" : "#EF4444",
                }}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="banner-divider" style={{ width: "1px", height: "20px", background: "#E2E8F0" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>Token:</span>
          <span style={{ fontSize: "0.8125rem", color: "#0F172A", fontWeight: 600 }}>
            {tokenExpiresAt ? format(new Date(tokenExpiresAt), "d MMM yyyy") : "Never Expires"}
          </span>
        </div>

        <div className="banner-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isSchedulerRunning ? "#10B981" : "#F59E0B",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
            Scheduler: <strong style={{ color: "#0F172A" }}>{schedulerLabel}</strong>
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="responsive-grid-4" style={{ marginBottom: "24px" }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              id={stat.id}
              style={{
                background: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748B" }}>
                  {stat.label}
                </span>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: stat.iconBg,
                    border: `1px solid ${stat.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={17} color={stat.iconColor} />
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    marginBottom: "6px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>
                  {stat.subValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Two-Column Grid */}
      <div className="responsive-grid-2">
        {/* Upcoming Posts */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "10px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Upcoming Posts</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px", margin: 0 }}>
                Next posts scheduled in publishing queue
              </p>
            </div>
            <a
              href="/queue"
              style={{
                fontSize: "0.8125rem",
                color: "#6366F1",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View all &rarr;
            </a>
          </div>

          {activeQueue.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  border: "2px dashed #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Clock size={24} color="#94A3B8" />
              </div>
              <p style={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px", fontSize: "0.9375rem" }}>
                Queue is empty
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                Generate drafts and approve them to schedule publication.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeQueue.map((item, idx) => (
                <div
                  key={item.id}
                  id={`queue-preview-item-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#EEF2FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#6366F1",
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
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.contentVersion?.headline || "Untitled Post"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                      {item.scheduledAt ? format(new Date(item.scheduledAt), "EEE d MMM, HH:mm") : "Slot pending"}
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeMap[item.status] || "badge-queued"}`} style={{ flexShrink: 0 }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", margin: "0 0 4px 0" }}>
            Recent Activity
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 20px 0" }}>
            Latest audit events
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "#94A3B8", textAlign: "center", padding: "20px 0", margin: 0 }}>
                No recent activity.
              </p>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: act.isError ? "#EF4444" : "#6366F1",
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>
                      {act.text}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "2px" }}>
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
