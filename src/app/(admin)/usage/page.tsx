import { Metadata } from "next";
import { BarChart2, TrendingUp, Database, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { usageRecords, auditLogs, users } from "@/lib/db/schema";
import { desc, count, sql, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Usage & Audit" };
export const dynamic = "force-dynamic";

export default async function UsagePage() {
  // 1. Fetch real audit logs
  const logs = await db
    .select({
      log: auditLogs,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  // 2. Fetch usage summary
  const recentUsages = await db
    .select()
    .from(usageRecords)
    .orderBy(desc(usageRecords.createdAt))
    .limit(10);

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }} className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>Usage & Audit</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Free-quota usage across AI adapters and an append-only audit trail of all operational events.
        </p>
      </div>

      {/* Free Tier Quota Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px", marginBottom: "32px" }}>
        <div className="glass-card-elevated" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Gemini API (Google AI Studio)</div>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "2px" }}>Active</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Permanent Free Allowance</div>
          <span className="badge badge-approved" style={{ marginTop: "10px", fontSize: "0.7rem" }}>Class C [Zero Cost]</span>
        </div>

        <div className="glass-card-elevated" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Cloudflare Workers AI</div>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "2px" }}>Active</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>FLUX.1 schnell daily tier</div>
          <span className="badge badge-approved" style={{ marginTop: "10px", fontSize: "0.7rem" }}>Class C [Zero Cost]</span>
        </div>

        <div className="glass-card-elevated" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Cloudflare R2 Storage</div>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "2px" }}>10 GB Free</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Original & Final Assets</div>
          <span className="badge badge-approved" style={{ marginTop: "10px", fontSize: "0.7rem" }}>Class B [Permanent]</span>
        </div>

        <div className="glass-card-elevated" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Facebook Pages API</div>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "2px" }}>Unlimited</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Graph API Direct</div>
          <span className="badge badge-approved" style={{ marginTop: "10px", fontSize: "0.7rem" }}>Class C [Official]</span>
        </div>
      </div>

      {/* Append-Only Audit Trail */}
      <div className="glass-card-elevated" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Append-Only System Audit Log</h2>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Immutable audit trail</span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
            No audit records logged yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", textAlign: "left" }}>
                <th style={{ padding: "12px 20px" }}>Action</th>
                <th style={{ padding: "12px 20px" }}>Entity</th>
                <th style={{ padding: "12px 20px" }}>Actor</th>
                <th style={{ padding: "12px 20px" }}>Timestamp (UK)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 20px", fontFamily: "monospace", color: "rgb(196,181,253)" }}>
                    {row.log.action}
                  </td>
                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.8)" }}>
                    {row.log.entityType} ({row.log.entityId ? row.log.entityId.slice(0, 8) + "..." : "system"})
                  </td>
                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.6)" }}>
                    {row.userName || row.userEmail || "System"}
                  </td>
                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.4)" }}>
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Europe/London",
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(row.log.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
