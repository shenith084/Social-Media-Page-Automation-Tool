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

  // Live image preview URL based on currently typed headline
  const previewHeadline = headline.trim() || initialHeadline || "Viral Reels";
  const imagePreviewUrl = `/api/v1/internal/render-image?headline=${encodeURIComponent(previewHeadline)}&prompt=${encodeURIComponent(topic || previewHeadline)}`;

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
      // First save if any changes
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
    });
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
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              background: "rgba(139,92,246,0.15)",
              color: "rgb(167,139,250)",
              border: "1px solid rgba(139,92,246,0.3)",
              textTransform: "capitalize",
            }}
          >
            {status}
          </span>
          {topic && (
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
              Topic: {topic}
            </span>
          )}
        </div>

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
              padding: "10px 18px",
              background: saveSuccess
                ? "rgba(34,197,94,0.15)"
                : "rgba(255,255,255,0.06)",
              border: `1px solid ${saveSuccess ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "8px",
              color: saveSuccess ? "rgb(34,197,94)" : "white",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
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
              padding: "10px 20px",
              background: "linear-gradient(135deg, rgb(34,197,94), rgb(22,163,74))",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isApproving ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
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
              padding: "10px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isArchiving ? "wait" : "pointer",
            }}
          >
            <Archive size={15} />
            Archive
          </button>
        </div>
      </div>

      {/* Editor grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Headline input */}
          <div className="glass-card-elevated" style={{ padding: "24px" }}>
            <label
              htmlFor="draft-headline"
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Sparkles size={13} style={{ color: "rgb(139,92,246)" }} />
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
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "white",
                fontSize: "1.0625rem",
                fontWeight: 600,
                outline: "none",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.35)",
                display: "block",
                marginTop: "6px",
              }}
            >
              Changes to this headline immediately re-render the preview visual on the right.
            </span>
          </div>

          {/* Caption textarea */}
          <div className="glass-card-elevated" style={{ padding: "24px" }}>
            <label
              htmlFor="draft-caption"
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "8px",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
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
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Hashtags input */}
          <div className="glass-card-elevated" style={{ padding: "24px" }}>
            <label
              htmlFor="draft-hashtags"
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Hash size={13} style={{ color: "rgb(59,130,246)" }} />
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
                padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "rgb(147,197,253)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Right side: Live image preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glass-card-elevated" style={{ padding: "20px" }}>
            <h2
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ImageIcon size={13} style={{ color: "rgb(234,179,8)" }} />
              Live Image Preview (1080x1080)
            </h2>

            <div
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#0f0f1a",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={imagePreviewUrl}
                alt="Post preview"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.35)",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              Rendered with exact headline & branding template
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}