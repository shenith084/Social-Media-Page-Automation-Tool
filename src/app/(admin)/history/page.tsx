import { Metadata } from "next";
import { ExternalLink, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Published History" };

const PUBLISHED = [
  {
    id: "pub-1",
    title: "Morning Motivation",
    caption: "Start your Monday with intention. Here are three powerful mindset shifts to carry you through the week…",
    publishedAt: "2026-10-08T08:00:23Z",
    platformPostId: "fb_987654321",
    postLink: "https://www.facebook.com/987654321",
    imageUrl: null,
  },
  {
    id: "pub-2",
    title: "Weekend Round-Up",
    caption: "What a weekend! Here's a look back at the highlights and what's coming next week…",
    publishedAt: "2026-10-07T13:00:44Z",
    platformPostId: "fb_876543210",
    postLink: "https://www.facebook.com/876543210",
    imageUrl: null,
  },
  {
    id: "pub-3",
    title: "Product Feature Spotlight",
    caption: "Did you know? Our latest feature saves teams an average of 3 hours per week. Here's how it works…",
    publishedAt: "2026-10-07T09:01:02Z",
    platformPostId: "fb_765432109",
    postLink: "https://www.facebook.com/765432109",
    imageUrl: null,
  },
];

function formatPublished(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HistoryPage() {
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
                    {post.caption.length > 90 ? post.caption.slice(0, 87) + "…" : post.caption}
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
                    href={post.postLink}
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
