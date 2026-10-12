import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, CheckCircle, XCircle, SkipForward, ExternalLink, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { queueItems, contentVersions, publishingAttempts } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Recovery & Dead-Letter Queue" };
export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const problemJobs = await db
    .select({
      queueItem: queueItems,
      contentVersion: contentVersions,
    })
    .from(queueItems)
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .where(inArray(queueItems.status, ["needs_review", "blocked", "retry_pending"]))
    .orderBy(desc(queueItems.updatedAt));

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={24} style={{ color: "rgb(234,179,8)" }} />
          Recovery & Dead-Letter Queue
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Manage posts requiring manual intervention or reconciliation. In accordance with safety rules, no retry is performed without confirming whether the post was already published to Facebook.
        </p>
      </div>

      {problemJobs.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <ShieldCheck size={44} style={{ color: "rgb(34,197,94)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>All Publishing Operations Healthy</h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", maxWidth: "440px", margin: "0 auto" }}>
            There are no blocked jobs or posts pending manual review. The queue dispatcher is running smoothly.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {problemJobs.map((job) => (
            <div key={job.queueItem.id} className="glass-card-elevated" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>
                      {job.contentVersion?.headline || "Untitled Job"}
                    </h3>
                    <span className={`badge badge-${job.queueItem.status}`}>
                      {job.queueItem.status.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    Queue Item ID: {job.queueItem.id}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(234,179,8,0.06)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "16px",
                }}
              >
                <strong>Status Reason: </strong>
                {job.queueItem.status === "needs_review"
                  ? "Sent marker recorded but no response received within timeout. Must reconcile Facebook Page before any retry."
                  : job.queueItem.status === "blocked"
                  ? "Rejected by platform API or permanent validation error. Unblock manually or replace content."
                  : "Transient failure encountered. Scheduled for backoff retry."}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {job.queueItem.status === "needs_review" && (
                  <form action={`/api/v1/queue-items/${job.queueItem.id}/reconcile`} method="POST">
                    <button type="button" className="btn btn-primary" style={{ fontSize: "0.8125rem", padding: "6px 14px" }}>
                      Safe Reconcile Check
                    </button>
                  </form>
                )}
                <Link
                  href="/queue"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8125rem", padding: "6px 14px" }}
                >
                  Manage in Queue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
