import { Metadata } from "next";
import { AlertTriangle, RefreshCcw, CheckCircle, XCircle, SkipForward, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Recovery" };

const RECOVERY_ITEMS = [
  {
    id: "r-1",
    title: "Campaign Hero Shot",
    status: "needs_review",
    errorType: "Timeout",
    errorDetail:
      "The request was sent to Facebook but no response was received within 60 seconds. The post may or may not have been published.",
    attempts: 1,
    lastAttempt: "2026-10-08T09:45:00Z",
    scheduledAt: "2026-10-08T08:00:00Z",
    actions: ["reconcile", "confirm_published", "skip", "cancel"],
  },
  {
    id: "r-2",
    title: "Autumn Promo",
    status: "blocked",
    errorType: "Content failure",
    errorDetail:
      "Facebook rejected the post: Image dimensions do not meet requirements (must be at least 600×315px).",
    attempts: 1,
    lastAttempt: "2026-10-08T08:00:00Z",
    scheduledAt: "2026-10-08T08:00:00Z",
    actions: ["replace", "cancel"],
  },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  needs_review: { label: "Needs Review", cls: "badge-needs-review" },
  blocked: { label: "Blocked", cls: "badge-blocked" },
  retry_pending: { label: "Retry Pending", cls: "badge-retry" },
};

const ERROR_COLOUR: Record<string, string> = {
  "Timeout": "234,179,8",
  "Content failure": "239,68,68",
  "Permission failure": "239,68,68",
  "Token expired": "251,146,60",
  "Transient failure": "59,130,246",
};

export default function RecoveryPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "960px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={24} style={{ color: "rgb(234,179,8)" }} />
          Recovery
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Posts requiring manual resolution. Each action is recorded in the audit log.
          A safe retry always checks whether the post was already published before sending again.
        </p>
      </div>

      {RECOVERY_ITEMS.length === 0 ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: "12px",
          }}
        >
          <CheckCircle size={40} style={{ color: "rgb(34,197,94)", margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600, marginBottom: "4px" }}>All clear</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
            No posts currently need attention.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {RECOVERY_ITEMS.map((item) => {
            const { label, cls } = STATUS_MAP[item.status] ?? { label: item.status, cls: "" };
            const errColour = ERROR_COLOUR[item.errorType] ?? "239,68,68";

            return (
              <div
                key={item.id}
                id={item.id}
                className="glass-card-elevated"
                style={{
                  padding: "24px",
                  borderLeft: `3px solid rgba(${errColour}, 0.5)`,
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{item.title}</h2>
                      <span className={`badge ${cls}`}>{label}</span>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
                      Scheduled: {new Date(item.scheduledAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} · Attempts: {item.attempts}
                    </div>
                  </div>
                </div>

                {/* Error detail */}
                <div
                  style={{
                    padding: "12px 14px",
                    background: `rgba(${errColour}, 0.08)`,
                    border: `1px solid rgba(${errColour}, 0.2)`,
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: `rgb(${errColour})`, marginBottom: "4px" }}>
                    {item.errorType}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    {item.errorDetail}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {item.actions.includes("reconcile") && (
                    <button
                      id={`btn-reconcile-${item.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "rgba(59,130,246,0.12)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        borderRadius: "6px",
                        color: "rgb(96,165,250)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <RefreshCcw size={13} />
                      Safe Retry (reconcile first)
                    </button>
                  )}
                  {item.actions.includes("confirm_published") && (
                    <button
                      id={`btn-confirm-${item.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: "6px",
                        color: "rgb(74,222,128)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle size={13} />
                      Confirm Published (enter post ID)
                    </button>
                  )}
                  {item.actions.includes("replace") && (
                    <button
                      id={`btn-replace-${item.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "rgba(139,92,246,0.12)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        borderRadius: "6px",
                        color: "rgb(167,139,250)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Replace Content
                    </button>
                  )}
                  {item.actions.includes("skip") && (
                    <button
                      id={`btn-skip-${item.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: "rgba(107,114,128,0.1)",
                        border: "1px solid rgba(107,114,128,0.2)",
                        borderRadius: "6px",
                        color: "rgba(156,163,175,0.8)",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      <SkipForward size={13} />
                      Skip
                    </button>
                  )}
                  {item.actions.includes("cancel") && (
                    <button
                      id={`btn-cancel-${item.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "6px",
                        color: "rgba(239,68,68,0.8)",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      <XCircle size={13} />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
