"use client";

import { useState, useTransition } from "react";
import { Trash2, Eye, Play, Pause, Loader2 } from "lucide-react";
import { removeQueueItemAction, toggleQueuePauseAction } from "@/app/actions/queue-manage";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

interface Props {
  itemId: string;
  status: string;
  draftId?: string | null;
}

export function QueueRowActions({ itemId, status, draftId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { confirm: showConfirm, alert: showAlert } = useDialog();

  const handleRemove = async () => {
    if (itemId.startsWith("showcase-")) {
      await showAlert({
        title: "Showcase Item",
        message: "This is a preview showcase item. Generate and approve your own drafts to manage live queue items.",
        type: "info",
      });
      return;
    }
    const ok = await showConfirm({
      title: "Remove from Queue",
      message: "Remove this post from the queue? The draft will be safely kept in your Draft Library.",
      confirmText: "Yes, Remove Post",
      cancelText: "Keep in Queue",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;

    startTransition(async () => {
      await removeQueueItemAction(itemId);
      router.refresh();
    });
  };

  const previewHref = draftId ? `/drafts/${draftId}` : "/drafts";

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
      <a
        href={previewHref}
        id={`btn-preview-${itemId}`}
        title="Preview draft"
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "#FFFFFF",
          border: "1px solid #E0E7FF",
          color: "#6366F1",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6366F1";
          e.currentTarget.style.background = "#EEF2FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E0E7FF";
          e.currentTarget.style.background = "#FFFFFF";
        }}
      >
        <Eye size={15} />
      </a>

      <button
        id={`btn-remove-${itemId}`}
        title="Remove from queue (keeps draft)"
        onClick={handleRemove}
        disabled={isPending}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#EF4444",
          cursor: isPending ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isPending ? 0.5 : 1,
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(239,68,68,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#EF4444";
          e.currentTarget.style.background = "#FEE2E2";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#FECACA";
          e.currentTarget.style.background = "#FEF2F2";
        }}
      >
        <Trash2 size={15} />
      </button>

      {status === "needs_review" && (
        <a
          href="/recovery"
          id={`btn-resolve-${itemId}`}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: "#EDE9FE",
            border: "1px solid #DDD6FE",
            color: "#6366F1",
            fontSize: "0.75rem",
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Resolve
        </a>
      )}
    </div>
  );
}

export function QueuePauseButton({ isPaused }: { isPaused: boolean }) {
  const [paused, setPaused] = useState(isPaused);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      const res = await toggleQueuePauseAction(paused);
      if (res.success) {
        setPaused(!paused);
        router.refresh();
      }
    });
  };

  return (
    <button
      id="btn-pause-queue"
      onClick={toggle}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "9px 18px",
        background: "#FFFFFF",
        border: "1px solid #FDE68A",
        borderRadius: "10px",
        color: "#D97706",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.7 : 1,
        transition: "all 0.15s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#FFFDF7";
        e.currentTarget.style.borderColor = "#FBBF24";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.borderColor = "#FDE68A";
      }}
    >
      {pending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : paused ? (
        <Play size={15} />
      ) : (
        <Pause size={15} />
      )}
      {paused ? "Resume Queue" : "Pause Queue"}
    </button>
  );
}
