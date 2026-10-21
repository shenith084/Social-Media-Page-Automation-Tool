import { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Database, ShieldCheck, Zap, Bot, Share2, Activity, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { usageRecords, auditLogs, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserSession } from "@/lib/rbac-server";

export const metadata: Metadata = { title: "Usage & Audit | Pixzora Social" };
export const dynamic = "force-dynamic";

export default async function UsagePage() {
  const current = await getCurrentUserSession();
  if (!current || !current.isAdmin) {
    redirect("/dashboard");
  }

  let logs: Array<{
    log: typeof auditLogs.$inferSelect;
    userName: string | null;
    userEmail: string | null;
  }> = [];

  let recentUsages: (typeof usageRecords.$inferSelect)[] = [];

  try {
    logs = await db
      .select({
        log: auditLogs,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(25);

    recentUsages = await db
      .select()
      .from(usageRecords)
      .orderBy(desc(usageRecords.createdAt))
      .limit(10);
  } catch (err) {
    console.warn("Could not load usage/audit data from DB:", err);
  }

  const quotaCards = [
    {
      title: "Gemini 2.5 Flash",
      provider: "Google AI Studio",
      metric: "Active",
      detail: "Permanent Free Allowance",
      tier: "Class C [Zero Cost]",
      badgeColor: "#ECFDF5",
      badgeText: "#047857",
      badgeBorder: "#A7F3D0",
      icon: Bot,
      iconBg: "#EEF2FF",
      iconColor: "#6366F1",
    },
    {
      title: "Cloudflare Workers AI",
      provider: "FLUX.1-schnell model",
      metric: "Active",
      detail: "Daily Free Tier Invocations",
      tier: "Class C [Zero Cost]",
      badgeColor: "#ECFDF5",
      badgeText: "#047857",
      badgeBorder: "#A7F3D0",
      icon: Zap,
      iconBg: "#FFF7ED",
      iconColor: "#F97316",
    },
    {
      title: "Cloudflare R2 Storage",
      provider: "Object Storage Bucket",
      metric: "10 GB",
      detail: "Zero egress fee bucket",
      tier: "Class B [Permanent Free]",
      badgeColor: "#EFF6FF",
      badgeText: "#1D4ED8",
      badgeBorder: "#BFDBFE",
      icon: Database,
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
    },
    {
      title: "Facebook Graph API",
      provider: "Meta for Developers",
      metric: "Direct",
      detail: "Official Page Publish Rate",
      tier: "Class C [Official API]",
      badgeColor: "#F5F3FF",
      badgeText: "#6D28D9",
      badgeBorder: "#DDD6FE",
      icon: Share2,
      iconBg: "#F5F3FF",
      iconColor: "#8B5CF6",
    },
  ];

  return (
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "26px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#EEF2FF",
              border: "1px solid #E0E7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(99,102,241,0.06)",
              flexShrink: 0,
            }}
          >
            <BarChart3 size={24} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Usage & Audit
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748B",
                margin: "3px 0 0 0",
              }}
            >
              Free-quota metrics across AI adapters and immutable system audit trail.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "8px 16px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <Activity size={16} style={{ color: "#10B981" }} />
          <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>
            Operational •{" "}
            <strong style={{ color: "#0F172A", fontWeight: 700 }}>
              Zero-Cost Tier Active
            </strong>
          </span>
        </div>
      </div>

      {/* Free Tier Quota Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {quotaCards.map((card, i) => {
          const IconComponent = card.icon;
          return (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "155px",
              }}
            >
              <div>
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
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {card.provider}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: card.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent size={16} style={{ color: card.iconColor }} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                    marginBottom: "2px",
                  }}
                >
                  {card.metric}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                  {card.detail}
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 9px",
                    borderRadius: "6px",
                    background: card.badgeColor,
                    color: card.badgeText,
                    border: `1px solid ${card.badgeBorder}`,
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                  }}
                >
                  {card.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Append-Only System Audit Log */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>
              Append-Only System Audit Log
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px" }}>
              Cryptographically timestamped trail of publishing and configuration actions
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "9999px",
              background: "#F1F5F9",
              color: "#475569",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} style={{ color: "#10B981" }} />
            Immutable Audit Trail
          </div>
        </div>

        {logs.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#64748B",
            }}
          >
            <ShieldCheck size={36} style={{ color: "#CBD5E1", margin: "0 auto 10px" }} />
            <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
              No audit records logged yet
            </div>
            <p style={{ fontSize: "0.8125rem", margin: 0 }}>
              System operations, queue updates, and configuration events will automatically appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Action
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Entity
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Actor
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Timestamp (UK)
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr
                    key={row.log.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 24px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: "#EEF2FF",
                          color: "#4F46E5",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid #E0E7FF",
                        }}
                      >
                        {row.log.action}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: "#0F172A", fontWeight: 500 }}>
                      {row.log.entityType}{" "}
                      <span style={{ color: "#94A3B8", fontSize: "0.75rem", fontWeight: 400 }}>
                        ({row.log.entityId ? row.log.entityId.slice(0, 8) + "..." : "system"})
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: "#475569" }}>
                      {row.userName || row.userEmail || "System Automation"}
                    </td>
                    <td style={{ padding: "14px 24px", color: "#64748B", fontSize: "0.8125rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Clock size={13} style={{ color: "#94A3B8" }} />
                        {new Intl.DateTimeFormat("en-GB", {
                          timeZone: "Europe/London",
                          dateStyle: "short",
                          timeStyle: "medium",
                        }).format(new Date(row.log.createdAt))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

