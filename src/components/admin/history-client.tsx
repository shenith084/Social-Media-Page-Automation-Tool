"use client";

import { useState, useMemo } from "react";
import { Clock, ExternalLink, Calendar, Search, ChevronDown, Info } from "lucide-react";

export interface PublishedPostItem {
  id: string;
  title: string;
  caption: string;
  publishedAt: string;
  formattedPublishedAt: string;
  platformPostId: string;
  postLink: string | null;
  image: string;
}

interface Props {
  initialPosts: PublishedPostItem[];
}

export function HistoryClient({ initialPosts }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "7days" | "30days">("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.caption.toLowerCase().includes(search.toLowerCase()) ||
        post.platformPostId.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "all") return true;

      const postDate = new Date(post.publishedAt).getTime();
      const now = new Date("2026-10-18T17:00:00Z").getTime();
      const diffDays = (now - postDate) / (1000 * 60 * 60 * 24);

      if (filter === "7days") return diffDays <= 7;
      if (filter === "30days") return diffDays <= 30;

      return true;
    });
  }, [initialPosts, search, filter]);

  const filterLabel =
    filter === "all" ? "All time" : filter === "7days" ? "Past 7 days" : "Past 30 days";

  return (
    <div>
      {/* Top Header Row */}
      <div
        className="admin-page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "26px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#EDE9FE",
              border: "1px solid #DDD6FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(99,102,241,0.06)",
              flexShrink: 0,
            }}
          >
            <Clock size={24} style={{ color: "#6366F1" }} strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Published History
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748B",
                margin: "4px 0 0",
                fontWeight: 400,
              }}
            >
              Read-only record of all published posts. Times shown in Europe/London (BST, UTC+1).
            </p>
          </div>
        </div>

        {/* Right Controls: Date Filter Dropdown + Search Box */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Date Filter Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              id="btn-filter-date"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 14px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#334155",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Calendar size={15} style={{ color: "#64748B" }} />
              <span>{filterLabel}</span>
              <ChevronDown size={14} style={{ color: "#94A3B8" }} />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)",
                  padding: "6px",
                  zIndex: 40,
                  minWidth: "150px",
                }}
              >
                {(["all", "7days", "30days"] as const).map((key) => {
                  const label = key === "all" ? "All time" : key === "7days" ? "Past 7 days" : "Past 30 days";
                  const isSelected = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setFilter(key);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: "0.8125rem",
                        color: isSelected ? "#4F46E5" : "#334155",
                        fontWeight: isSelected ? 600 : 500,
                        background: isSelected ? "#EEF2FF" : "transparent",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              id="input-search-posts"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              style={{
                padding: "9px 14px 9px 36px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                fontSize: "0.875rem",
                color: "#0F172A",
                outline: "none",
                width: "220px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
            />
          </div>
        </div>
      </div>

      {/* Main White Card Container */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div className="table-responsive-container">
          <table
            id="history-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
            role="table"
            aria-label="Published posts history"
          >
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th
                  style={{
                    padding: "14px 20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  POST
                </th>
                <th
                  style={{
                    padding: "14px 20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "200px",
                    whiteSpace: "nowrap",
                  }}
                >
                  PUBLISHED (UK LOCAL)
                </th>
                <th
                  style={{
                    padding: "14px 20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "260px",
                    whiteSpace: "nowrap",
                  }}
                >
                  PLATFORM ID
                </th>
                <th
                  style={{
                    padding: "14px 20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "180px",
                    whiteSpace: "nowrap",
                  }}
                >
                  LINK
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "48px 24px",
                      textAlign: "center",
                      color: "#64748B",
                      fontSize: "0.875rem",
                    }}
                  >
                    No published posts match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post, idx) => (
                  <tr
                    key={post.id}
                    id={post.id}
                    style={{
                      borderBottom: idx < filteredPosts.length - 1 ? "1px solid #F1F5F9" : "none",
                      transition: "background 0.12s ease",
                    }}
                  >
                    {/* Post with Thumbnail + Headline + Caption */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", maxWidth: "620px" }}>
                        {/* Live Post Image Thumbnail */}
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            flexShrink: 0,
                            background: "#0F1123",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.image}
                            alt={post.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>

                        {/* Text info - multi-line wrapped */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              color: "#0F172A",
                              lineHeight: 1.35,
                              marginBottom: "4px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "#64748B",
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.caption}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Published (UK Local) */}
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 600 }}>
                          {post.formattedPublishedAt}
                        </span>
                      </div>
                    </td>

                    {/* Platform ID */}
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 12px",
                          borderRadius: "9999px",
                          background: "#F1F5F9",
                          color: "#475569",
                          fontSize: "0.75rem",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontWeight: 500,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {post.platformPostId}
                      </span>
                    </td>

                    {/* Link to Facebook */}
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      <a
                        href={post.postLink || `https://www.facebook.com/${post.platformPostId}`}
                        id={`link-${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.875rem",
                          color: "#4F46E5",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#3730A3")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#4F46E5")}
                      >
                        View on Facebook
                        <ExternalLink size={15} style={{ color: "#4F46E5" }} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Read-only Note */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "18px",
          fontSize: "0.8125rem",
          color: "#64748B",
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#64748B",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "serif",
            flexShrink: 0,
          }}
        >
          i
        </div>
        <span>
          Published posts are read-only. Editing or deleting live posts is not available in this release.
        </span>
      </div>
    </div>
  );
}
