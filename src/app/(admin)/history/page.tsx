import { Metadata } from "next";
import { ExternalLink, Clock, AlertTriangle, History } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Published History" };

import { db } from "@/lib/db";
import { publishedPosts, queueItems, contentVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatPublished(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function HistoryPage() {
  let data: Array<{
    published: typeof publishedPosts.$inferSelect;
    contentVersion: typeof contentVersions.$inferSelect | null;
  }> = [];
  let dbError: string | null = null;

  try {
    data = await db
      .select({
        published: publishedPosts,
        contentVersion: contentVersions,
      })
      .from(publishedPosts)
      .leftJoin(queueItems, eq(publishedPosts.queueItemId, queueItems.id))
      .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
      .orderBy(desc(publishedPosts.actualPublishedAt));
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : String(err);
    console.warn("Could not load published history from DB (transient error):", dbError);
  }

  const PUBLISHED = data.map((d) => ({
    id: d.published.id,
    title: d.contentVersion?.headline || "Untitled Post",
    caption: d.contentVersion?.caption || "No caption",
    publishedAt: d.published.actualPublishedAt?.toISOString() || new Date().toISOString(),
    platformPostId: d.published.platformPostId,
    postLink: d.published.postLink,
    imageUrl: null,
  }));

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
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <History size={24} color="#6366F1" />
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
              Published History
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Read-only record of all published posts. Times shown in Europe/London (BST, UTC+1).
            </p>
          </div>
        </div>
      </div>

      {dbError && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={18} color="#DC2626" />
          <span style={{ fontSize: "0.875rem", color: "#B91C1C", fontWeight: 500 }}>
            Transient connection error to database. Please refresh your browser.
          </span>
        </div>
      )}

      {/* Main Container */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {PUBLISHED.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <History size={28} color="#6366F1" />
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
              No published posts yet
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0 auto 24px", maxWidth: "420px" }}>
              Posts that are approved and dispatched will appear here with live links to Facebook.
            </p>
            <Link
              href="/queue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                background: "#4F46E5",
                borderRadius: "10px",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
              }}
            >
              Go to Publishing Queue
            </Link>
          </div>
        ) : (
          <table
            id="history-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
            role="table"
            aria-label="Published posts history"
          >
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Post", "Published (UK local)", "Platform ID", "Link"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 18px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PUBLISHED.map((post, i) => (
                <tr
                  key={post.id}
                  id={post.id}
                  style={{
                    borderBottom: i < PUBLISHED.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <td style={{ padding: "16px 18px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "4px" }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.4 }}>
                      {post.caption.length > 90 ? post.caption.slice(0, 87) + "..." : post.caption}
                    </div>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} color="#10B981" />
                      <span style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 500 }}>
                        {formatPublished(post.publishedAt)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <code style={{
                      fontSize: "0.75rem",
                      color: "#475569",
                      background: "#F1F5F9",
                      border: "1px solid #E2E8F0",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}>
                      {post.platformPostId}
                    </code>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <a
                      href={post.postLink || "#"}
                      id={`link-${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8125rem",
                        color: "#4F46E5",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View on Facebook
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: "16px", fontSize: "0.75rem", color: "#94A3B8" }}>
        Published posts are read-only. Editing or deleting live posts is not available in this release.
      </p>
    </div>
  );
}

