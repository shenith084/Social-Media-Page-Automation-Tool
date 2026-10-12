import { Metadata } from "next";
import { ExternalLink, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Published History" };

import { db } from "@/lib/db";
import { publishedPosts, queueItems, contentVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatPublished(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function HistoryPage() {
  const data = await db
    .select({
      published: publishedPosts,
      contentVersion: contentVersions,
    })
    .from(publishedPosts)
    .leftJoin(queueItems, eq(publishedPosts.queueItemId, queueItems.id))
    .leftJoin(contentVersions, eq(queueItems.contentVersionId, contentVersions.id))
    .orderBy(desc(publishedPosts.actualPublishedAt));

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
    <div style={{ padding: "32px", maxWidth: "1100px" }} className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>Published History</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Read-only record of all published posts. Times shown in Europe/London (BST, UTC+1).
        </p>
      </div>

      <div className="glass-card-elevated" style={{ overflow: "hidden" }}>
        <table
          id="history-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
          role="table"
          aria-label="Published posts history"
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Post", "Published (UK local)", "Platform ID", "Link"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.05em",
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
                  borderBottom: i < PUBLISHED.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <td style={{ padding: "16px" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem", marginBottom: "4px" }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    {post.caption.length > 90 ? post.caption.slice(0, 87) + "â€¦" : post.caption}
                  </div>
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={13} style={{ color: "rgba(34,197,94,0.6)" }} />
                    <span style={{ fontSize: "0.875rem" }}>{formatPublished(post.publishedAt)}</span>
                  </div>
                </td>
                <td style={{ padding: "16px" }}>
                  <code style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                    {post.platformPostId}
                  </code>
                </td>
                <td style={{ padding: "16px" }}>
                  <a
                    href={post.postLink || "#"}
                    id={`link-${post.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.8125rem",
                      color: "rgba(96,165,250,0.8)",
                      textDecoration: "none",
                    }}
                  >
                    View on Facebook
                    <ExternalLink size={11} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "16px", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
        Published posts are read-only. Editing or deleting live posts is not available in this release.
      </p>
    </div>
  );
}
