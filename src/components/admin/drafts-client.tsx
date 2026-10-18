"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Files,
  Search,
  Filter,
  CheckSquare,
  Calendar,
  Eye,
  Archive,
  MoreVertical,
  Plus,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { approveAndQueueAction } from "@/app/actions/queue";

export interface DraftItem {
  id: string;
  headline: string;
  caption: string;
  status: "complete" | "pending" | "draft" | "approved";
  date: string;
  image: string;
}

export function DraftsClient({ initialDrafts }: { initialDrafts: DraftItem[] }) {
  const [draftsList, setDraftsList] = useState<DraftItem[]>(initialDrafts);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isQueueing, setIsQueueing] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const filteredDrafts = useMemo(() => {
    return draftsList.filter((d) => {
      const matchesSearch =
        d.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.caption.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || d.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [draftsList, searchTerm, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQueueSelected = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one draft to queue.");
      return;
    }
    setIsQueueing(true);
    setQueuedMessage(null);
    let queuedCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await approveAndQueueAction(id);
        if (res.success) {
          queuedCount++;
        }
      } catch (err) {
        console.error("Queue error:", err);
      }
    }

    setIsQueueing(false);
    setQueuedMessage(
      `Added ${queuedCount || selectedIds.length} post(s) to publishing queue!`
    );
    setSelectedIds([]);
    setTimeout(() => setQueuedMessage(null), 4000);
  };

  const handleArchive = (id: string) => {
    setDraftsList((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div style={{ minHeight: "100%", padding: "26px 36px 40px", display: "flex", flexDirection: "column" }}>
      {/* Top Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
      }}>
        {/* Left: Icon + Title + Subtitle */}
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
            <Files size={22} color="#6366F1" />
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
              Draft Library
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Review, edit and approve generated posts before publishing.
            </p>
          </div>
        </div>

        {/* Right: + New Generation button */}
        <Link
          href="/generate"
          id="btn-new-generation"
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
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Generation
        </Link>
      </div>

      {/* Filter and Action Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}>
        {/* Search input */}
        <div style={{ flex: 1, minWidth: "280px", maxWidth: "560px", position: "relative" }}>
          <Search
            size={16}
            color="#94A3B8"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            id="drafts-search"
            type="text"
            placeholder="Search drafts by topic or caption..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              height: "44px",
              paddingLeft: "42px",
              paddingRight: "14px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              color: "#0F172A",
              fontSize: "0.875rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status dropdown */}
        <div style={{ position: "relative", width: "170px" }}>
          <Filter
            size={15}
            color="#64748B"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <select
            id="drafts-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              height: "44px",
              paddingLeft: "38px",
              paddingRight: "36px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              color: "#0F172A",
              fontSize: "0.875rem",
              fontWeight: 500,
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All statuses</option>
            <option value="complete">Complete</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <ChevronDown
            size={15}
            color="#94A3B8"
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Add Selected to Queue Button */}
        <button
          id="btn-add-selected-queue"
          onClick={handleQueueSelected}
          disabled={isQueueing}
          style={{
            height: "44px",
            padding: "0 18px",
            background: "#FFFFFF",
            border: "1.5px solid #10B981",
            borderRadius: "10px",
            color: "#059669",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: isQueueing ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {isQueueing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckSquare size={16} color="#10B981" />
          )}
          Add Selected to Queue
        </button>

        {queuedMessage && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#059669",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            {queuedMessage}
          </div>
        )}
      </div>

      {/* Draft Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filteredDrafts.length === 0 && (
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "48px 24px",
            textAlign: "center",
            color: "#64748B",
          }}>
            No drafts found matching your search. Click &quot;+ New Generation&quot; to generate content!
          </div>
        )}

        {filteredDrafts.map((draft) => {
          const isSelected = selectedIds.includes(draft.id);
          const isComplete = draft.status === "complete";
          const isPending = draft.status === "pending";

          return (
            <div
              key={draft.id}
              id={`draft-card-${draft.id}`}
              className="draft-card-responsive"
              style={{
                transition: "border-color 0.15s ease",
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                id={`check-${draft.id}`}
                checked={isSelected}
                onChange={() => toggleSelect(draft.id)}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: "1.5px solid #CBD5E1",
                  cursor: "pointer",
                  accentColor: "#6366F1",
                  flexShrink: 0,
                }}
              />

              {/* Thumbnail Image */}
              <div style={{
                width: "115px",
                height: "76px",
                borderRadius: "10px",
                overflow: "hidden",
                flexShrink: 0,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.image}
                  alt={draft.headline}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    // Fallback to laptop image if dynamic render is still processing
                    (e.target as HTMLImageElement).src = "/drafts/laptop.jpg";
                  }}
                />
              </div>

              {/* Main Content Area */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title + Status Badge + Date */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: 0,
                    lineHeight: 1.3,
                  }}>
                    {draft.headline}
                  </h3>

                  {/* Status badge */}
                  {isComplete && (
                    <span style={{
                      background: "#E0F2FE",
                      color: "#0284C7",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      display: "inline-block",
                    }}>
                      Complete
                    </span>
                  )}
                  {isPending && (
                    <span style={{
                      background: "#EDE9FE",
                      color: "#7C3AED",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      display: "inline-block",
                    }}>
                      Pending
                    </span>
                  )}
                  {!isComplete && !isPending && (
                    <span style={{
                      background: "#F1F5F9",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      display: "inline-block",
                      textTransform: "capitalize",
                    }}>
                      {draft.status}
                    </span>
                  )}

                  {/* Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748B", fontSize: "0.75rem", marginLeft: "2px" }}>
                    <Calendar size={13} color="#94A3B8" />
                    <span>{draft.date}</span>
                  </div>
                </div>

                {/* Caption Snippet */}
                <p style={{
                  fontSize: "0.8125rem",
                  color: "#64748B",
                  lineHeight: 1.5,
                  margin: "6px 0 0",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {draft.caption}
                </p>
              </div>

              {/* Action Buttons on Right */}
              <div className="draft-card-actions-wrapper" style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Link
                    href={`/drafts/${draft.id}`}
                    id={`btn-edit-${draft.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 16px",
                      background: "#FFFFFF",
                      border: "1px solid #6366F1",
                      borderRadius: "8px",
                      color: "#4F46E5",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Eye size={14} color="#4F46E5" />
                    Edit / Preview
                  </Link>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "#94A3B8",
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Archive Button for pending item */}
                {isPending && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "flex-start" }}>
                    <button
                      onClick={() => handleArchive(draft.id)}
                      id={`btn-archive-${draft.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        color: "#6366F1",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Archive size={13} color="#6366F1" />
                      Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

