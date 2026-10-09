import { Metadata } from "next";
import { BarChart2, TrendingUp, Database } from "lucide-react";

export const metadata: Metadata = { title: "Usage & Audit" };

const USAGE_STATS = [
  { label: "Text AI calls today", value: "12", limit: "1,500", provider: "Gemini Flash", pct: 1 },
  { label: "Image AI calls today", value: "12", limit: "10,000", provider: "CF Workers AI", pct: 0.1 },
  { label: "Storage used", value: "234 MB", limit: "10,000 MB", provider: "Cloudflare R2", pct: 2.3 },
  { label: "Posts this month", value: "48", limit: "Unlimited", provider: "Facebook API", pct: 0 },
];

const AUDIT_EVENTS = [
  { id: "ae-1", action: "queue.approve", entity: "Draft #d-001 — 5 Productivity Tips", user: "Admin", at: "2026-10-08T11:00:00Z" },
  { id: "ae-2", action: "job.confirmPublished", entity: "Queue item #qi-004 — Campaign Hero Shot", user: "Admin", at: "2026-10-08T10:30:00Z" },
  { id: "ae-3", action: "schedule.rebuild", entity: "Page: Pixzora Labs Demo", user: "Admin", at: "2026-10-08T09:15:00Z" },
  { id: "ae-4", action: "auth.signIn", entity: "Session created", user: "Admin", at: "2026-10-08T09:00:00Z" },
];

function formatAuditTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "short", timeStyle: "medium" });
}

export default function UsagePage() {
  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }} className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>Usage & Audit</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Free-quota usage across AI and storage providers. Audit log is append-only.
        </p>
      </div>

      {/* Usage cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px", marginBottom: "32px" }}>
        {USAGE_STATS.map((s, i) => (
          <div key={i} id={`usage-card-${i}`} className="glass-card-elevated" style={{ padding: "18px" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>{s.provider}</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "2px" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>{s.label} · limit {s.limit}</div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(s.pct, 100)}%`,
                background: s.pct > 80 ? "rgb(239,68,68)" : s.pct > 60 ? "rgb(234,179,8)" : "rgb(139,92,246)",
                borderRadius: "2px",
                transition: "width 0.5s",
              }} />
            </div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{s.pct.toFixed(1)}% used</div>
          </div>
        ))}
      </div>

      {/* Audit log */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Database size={15} style={{ color: "rgba(139,92,246,0.7)" }} />
          Audit Log
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
            · Append-only · Europe/London times
          </span>
        </h2>
        <div className="glass-card-elevated" style={{ overflow: "hidden" }}>
          <table id="audit-log-table" style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Audit log">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Action", "Entity", "User", "Time (UK local)"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_EVENTS.map((ev, i) => (
                <tr key={ev.id} id={ev.id} style={{ borderBottom: i < AUDIT_EVENTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <code style={{ fontSize: "0.75rem", color: "rgb(167,139,250)", background: "rgba(139,92,246,0.1)", padding: "2px 7px", borderRadius: "4px" }}>
                      {ev.action}
                    </code>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>{ev.entity}</td>
                  <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>{ev.user}</td>
                  <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{formatAuditTime(ev.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: "10px", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
          API secrets and access tokens are never shown in this log.
        </p>
      </div>
    </div>
  );
}
