import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { queueItems, contentVersions } from "@/lib/db/schema";
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
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <AlertTriangle size={24} color="#D97706" />
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
              Recovery & Dead-Letter Queue
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Manage posts requiring manual intervention or reconciliation. In accordance with safety rules, no retry is performed without confirming whether the post was already published to Facebook.
            </p>
          </div>
        </div>
      </div>

      {problemJobs.length === 0 ? (
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
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldCheck size={32} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            All Publishing Operations Healthy
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748B", maxWidth: "460px", margin: "0 auto" }}>
            There are no blocked jobs or posts pending manual review. The queue dispatcher is running smoothly.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {problemJobs.map((job) => (
            <div
              key={job.queueItem.id}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A", margin: 0 }}>
                      {job.contentVersion?.headline || "Untitled Job"}
                    </h3>
                    <span
                      style={{
                        background: "#FEF3C7",
                        color: "#D97706",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        textTransform: "capitalize",
                      }}
                    >
                      {job.queueItem.status.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Queue Item ID: {job.queueItem.id}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  fontSize: "0.84rem",
                  color: "#92400E",
                  marginBottom: "18px",
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "#78350F" }}>Status Reason: </strong>
                {job.queueItem.status === "needs_review"
                  ? "Sent marker recorded but no response received within timeout. Must reconcile Facebook Page before any retry."
                  : job.queueItem.status === "blocked"
                  ? "Rejected by platform API or permanent validation error. Unblock manually or replace content."
                  : "Transient failure encountered. Scheduled for backoff retry."}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {job.queueItem.status === "needs_review" && (
                  <form action={`/api/v1/queue-items/${job.queueItem.id}/reconcile`} method="POST">
                    <button
                      type="button"
                      style={{
                        padding: "8px 18px",
                        background: "#4F46E5",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Safe Reconcile Check
                    </button>
                  </form>
                )}
                <Link
                  href="/queue"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    color: "#0F172A",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
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

