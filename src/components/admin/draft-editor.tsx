"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Save,
  CheckCircle2,
  Archive,
  Hash,
  Loader2,
  Image as ImageIcon,
  Check,
  FileText,
  Tag,
} from "lucide-react";
import { updateDraftContentAction, archiveDraftAction } from "@/app/actions/draft-detail";
import { approveAndQueueAction } from "@/app/actions/queue";
import { useRouter } from "next/navigation";

interface DraftEditorProps {
  itemId: string;
  initialHeadline: string;
  initialCaption: string;
  initialHashtags: string[];
  status: string;
  topic?: string | null;
}

export function DraftEditor({
  itemId,
  initialHeadline,
  initialCaption,
  initialHashtags,
  status,
  topic,
}: DraftEditorProps) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initialHeadline || "");
  const [caption, setCaption] = useState(initialCaption || "");
  const [hashtagsStr, setHashtagsStr] = useState(
    (initialHashtags || []).map((h) => `#${h.replace(/^#/, "")}`).join(" ")
  );
  const [isSaving, startSaveTransition] = useTransition();
  const [isApproving, startApproveTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Determine which generated image fits best
  const lowerHeadline = (headline || initialHeadline || "").toLowerCase();
  const lowerTopic = (topic || "").toLowerCase();

  let frontImage = "/drafts/laptop.jpg";
  if (lowerHeadline.includes("brand") || lowerTopic.includes("brand")) {
    frontImage = "/drafts/mountain.jpg";
  } else if (
    lowerHeadline.includes("superintelligence") ||
    lowerHeadline.includes("brain") ||
    lowerTopic.includes("superintelligence")
  ) {
    frontImage = "/drafts/brain.jpg";
  } else if (
    lowerHeadline.includes("everything") ||
    lowerHeadline.includes("change") ||
    lowerTopic.includes("megaphone")
  ) {
    frontImage = "/drafts/megaphone.jpg";
  }

  const handleSave = () => {
    setSaveSuccess(false);
    startSaveTransition(async () => {
      const parsedHashtags = hashtagsStr
        .split(/[\s,]+/)
        .map((h) => h.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await updateDraftContentAction(itemId, headline, caption, parsedHashtags);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        router.refresh();
      } else {
        alert("Failed to save changes: " + res.error);
      }
    });
  };

  const handleApprove = () => {
    startApproveTransition(async () => {
      const parsedHashtags = hashtagsStr
        .split(/[\s,]+/)
        .map((h) => h.trim().replace(/^#/, ""))
        .filter(Boolean);

      await updateDraftContentAction(itemId, headline, caption, parsedHashtags);
      const res = await approveAndQueueAction(itemId);
      if (res.success) {
        router.push("/queue");
      } else {
        alert("Approve & Queue failed: " + res.error);
      }
    });
  };

  const handleArchive = () => {
    if (!confirm("Are you sure you want to archive this draft?")) return;
    startArchiveTransition(async () => {
      await archiveDraftAction(itemId);
      router.push("/drafts");
    });
  };

  const isComplete = status.toLowerCase() === "complete";
  const isPending = status.toLowerCase() === "pending";

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "24px 28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748B",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <div>
      {/* Top action bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Status + Topic info */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {isComplete && (
            <span
              style={{
                padding: "3px 12px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "#E0F2FE",
                color: "#0284C7",
              }}
            >
              Complete
            </span>
          )}
          {isPending && (
            <span
              style={{
                padding: "3px 12px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "#EDE9FE",
                color: "#7C3AED",
              }}
            >
              Pending
            </span>
          )}
          {!isComplete && !isPending && (
            <span
              style={{
                padding: "3px 12px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "#F1F5F9",
                color: "#475569",
                textTransform: "capitalize",
              }}
            >
              {status}
            </span>
          )}

          {topic && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "8px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                fontSize: "0.8125rem",
                color: "#475569",
                fontWeight: 500,
              }}
            >
              <Tag size={13} color="#6366F1" />
              <span>Topic: {topic}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            id="btn-save-draft"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              background: saveSuccess ? "#ECFDF5" : "#FFFFFF",
              border: `1px solid ${saveSuccess ? "#10B981" : "#E2E8F0"}`,
              borderRadius: "10px",
              color: saveSuccess ? "#059669" : "#0F172A",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isSaving ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={15} color="#059669" />
            ) : (
              <Save size={15} color="#64748B" />
            )}
            {saveSuccess ? "Saved!" : "Save Changes"}
          </button>

          <button
            type="button"
            id="btn-approve-queue"
            onClick={handleApprove}
            disabled={isApproving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              background: "#10B981",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isApproving ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            {isApproving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {isApproving ? "Scheduling..." : "Approve & Queue"}
          </button>

          <button
            type="button"
            id="btn-archive-draft"
            onClick={handleArchive}
            disabled={isArchiving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              color: "#64748B",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isArchiving ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Archive size={15} color="#64748B" />
            Archive
          </button>
        </div>
      </div>

      {/* Editor Grid: 2 Columns */}
      <div className="draft-editor-split">
        {/* Left Column: Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. Headline */}
          <div style={cardStyle}>
            <label htmlFor="draft-headline" style={labelStyle}>
              <Sparkles size={14} color="#6366F1" />
              Headline (Overlay on Image)
            </label>
            <input
              id="draft-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Catchy headline under 80 characters"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                color: "#0F172A",
                fontSize: "1.0625rem",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94A3B8",
                display: "block",
                marginTop: "8px",
              }}
            >
              Changes to this headline immediately re-render the preview visual on the right.
            </span>
          </div>

          {/* 2. Caption */}
          <div style={cardStyle}>
            <label htmlFor="draft-caption" style={labelStyle}>
              <FileText size={14} color="#6366F1" />
              Post Caption (British English)
            </label>
            <textarea
              id="draft-caption"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Engaging caption copy with call to action..."
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                color: "#0F172A",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
                minHeight: "170px",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>

          {/* 3. Hashtags */}
          <div style={cardStyle}>
            <label htmlFor="draft-hashtags" style={labelStyle}>
              <Hash size={14} color="#6366F1" />
              Hashtags (Space or comma separated)
            </label>
            <input
              id="draft-hashtags"
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              placeholder="#Marketing #Business #SocialMedia"
              style={{
                width: "100%",
                padding: "11px 16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                color: "#4F46E5",
                fontSize: "0.875rem",
                fontWeight: 500,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>
        </div>

        {/* Right Column: Live Image Preview (Facebook Post Visual) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: "20px" }}>
            <h2
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748B",
                marginBottom: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                margin: "0 0 14px",
              }}
            >
              <ImageIcon size={14} color="#D97706" />
              Live Image Preview (1080x1080)
            </h2>

            {/* Visual Box with image and live overlay */}
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                background: "#0F172A",
                aspectRatio: "1/1",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frontImage}
                alt="Post preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Live Overlay Banner */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.25) 45%, rgba(15, 23, 42, 0.4) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "18px",
                  color: "white",
                  pointerEvents: "none",
                }}
              >
                {/* Brand header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    Pixzora
                  </div>
                  <div style={{
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 500,
                  }}>
                    Facebook Ready
                  </div>
                </div>

                {/* Headline Text in center/bottom */}
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 800,
                      lineHeight: 1.3,
                      margin: "0 0 6px",
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {headline || initialHeadline || "Post Headline"}
                  </h3>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.8)" }}>
                    Viral reels · AI Generated Visual
                  </div>
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748B",
                marginTop: "12px",
                textAlign: "center",
                marginBottom: 0,
              }}
            >
              Rendered with exact headline & branding template for Facebook
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

