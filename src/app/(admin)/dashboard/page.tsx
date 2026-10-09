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
import { queueItems, publishedPosts, auditLogs, pages, pageConnections, systemHeartbeats, contentVersions } from "@/lib/db/schema";
import { desc, asc, eq, sql, gt, isNull } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";

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

  // 1. Fetch real DB stats
  const activeQueueData = await db
    .select({
      queueItem: queueItems,
      contentVersion: contentVersions,
    })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .where(eq(queueItems.status, "queued"))
    .orderBy(asc(queueItems.scheduledAt))
    .limit(10);

  const activeQueue = activeQueueData.map(q => ({
    ...q.queueItem,
    contentVersion: q.contentVersion
  }));

  const nextPost = activeQueue[0];

  const publishedTodayCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(publishedPosts)
    .where(gt(publishedPosts.actualPublishedAt, today));

  const failuresCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(queueItems)
    .where(eq(queueItems.status, "needs_review"));

  // 2. Format stats for UI
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
      value: publishedTodayCount[0]?.count.toString() || "0",
      subValue: "Since midnight UTC",
      icon: CheckCircle2,
      colour: "34,197,94",
      trend: null,
    },
    {
      id: "stat-failures",
      label: "Action Required",
      value: failuresCount[0]?.count.toString() || "0",
      subValue: "Needs review",
      icon: AlertTriangle,
      colour: failuresCount[0]?.count > 0 ? "239,68,68" : "234,179,8",
      trend: null,
    },
  ];

  // 3. Fetch Recent Activity
  const recentLogs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 5,
  });

  const recentActivity = recentLogs.map((log) => ({
    id: log.id,
    text: log.action,
    time: formatDistanceToNow(log.createdAt, { addSuffix: true }),
    type: log.action.toLowerCase().includes("fail") || log.action.toLowerCase().includes("error") ? "error" : "info",
  }));

  // 4. Connection Health
  const activePageData = await db
    .select({
      page: pages,
      connection: pageConnections,
    })
    .from(pages)
    .leftJoin(pageConnections, eq(pages.id, pageConnections.pageId))
    .where(eq(pages.isActive, true))
    .limit(1);

  const connection = activePageData[0]?.connection;
  const isConnected = connection?.status === "connected";
  const tokenExpiresAt = connection?.tokenExpiresAt;

  // 5. System Heartbeat (Scheduler)
  const heartbeat = await db.query.systemHeartbeats.findFirst({
    where: eq(systemHeartbeats.component, "n8n-scheduler"),
    orderBy: [desc(systemHeartbeats.lastHeartbeatAt)],
  });

  const isSchedulerRunning = heartbeat ? (new Date().getTime() - heartbeat.lastHeartbeatAt.getTime() < 5 * 60 * 1000) : false;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>
            Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            {format(new Date(), "EEEE, d MMMM yyyy · OOOO")}
          </p>
        </div>

        {/* Quick action */}
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

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
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
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: `rgba(${stat.colour},0.15)`,
                    border: `1px solid rgba(${stat.colour},0.25)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: `rgb(${stat.colour})` }} />
                </div>
                {stat.trend && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "rgb(34,197,94)",
                      background: "rgba(34,197,94,0.1)",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2px" }}>{stat.value}</div>
              <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>{stat.label}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{stat.subValue}</div>
            </div>
          );
        })}
      </div>

      {/* Two-column content area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Upcoming queue */}
        <div className="glass-card-elevated" style={{ padding: "20px" }} id="widget-upcoming-queue">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Upcoming Queue</h2>
            <a href="/queue" style={{ fontSize: "0.75rem", color: "rgba(139,92,246,0.8)", textDecoration: "none" }}>
              View all →
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeQueue.length === 0 && (
              <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px" }}>
                Queue is empty. <a href="/generate" style={{ color: "rgb(167,139,250)" }}>Generate content</a>
              </div>
            )}
            {activeQueue.slice(0, 3).map((item) => (
              <div
                key={item.id}
                id={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.contentVersion?.headline || "Untitled Post"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={11} />
                    {format(item.scheduledAt, "MMM d, HH:mm")}
                  </div>
                </div>
                <span className={`badge ${statusBadgeMap[item.status] ?? "badge-queued"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass-card-elevated" style={{ padding: "20px" }} id="widget-recent-activity">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Recent Activity</h2>
            <a href="/usage" style={{ fontSize: "0.75rem", color: "rgba(139,92,246,0.8)", textDecoration: "none" }}>
              Audit log →
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentActivity.length === 0 && (
               <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px" }}>
                 No recent activity to show.
               </div>
            )}
            {recentActivity.map((item) => (
              <div
                key={item.id}
                id={item.id}
                style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: `rgb(${activityColour[item.type] || activityColour.info})`,
                    flexShrink: 0,
                    marginTop: "6px",
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", marginBottom: "2px" }}>
                    {item.text}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection health */}
      <div
        className="glass-card"
        id="widget-connection-health"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Wifi size={16} style={{ color: isConnected ? "rgb(34,197,94)" : "rgb(234,179,8)" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Facebook Page: {isConnected ? "Connected" : "Disconnected or not set up"}
          </span>
        </div>
        
        {isConnected && tokenExpiresAt && (
          <>
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
              Token expires: <span style={{ color: "rgba(255,255,255,0.7)" }}>{format(tokenExpiresAt, "d MMM yyyy")}</span>
            </div>
          </>
        )}

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
          Scheduler: <span style={{ color: isSchedulerRunning ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
            {isSchedulerRunning ? "● Running" : "● Offline / Stopped"}
          </span> 
          {heartbeat && ` · Last tick: ${formatDistanceToNow(heartbeat.lastHeartbeatAt, { addSuffix: true })}`}
        </div>
        
        <div style={{ marginLeft: "auto" }}>
          <a
            href="/settings"
            style={{ fontSize: "0.75rem", color: "rgba(139,92,246,0.8)", textDecoration: "none" }}
          >
            Page settings →
          </a>
        </div>
      </div>
    </div>
  );
}
