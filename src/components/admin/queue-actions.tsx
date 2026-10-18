"use client";

import { useState, useTransition } from "react";
import { Trash2, Eye, Play, Pause, Loader2 } from "lucide-react";
import { removeQueueItemAction, toggleQueuePauseAction } from "@/app/actions/queue-manage";
import { useRouter } from "next/navigation";

interface Props {
  itemId: string;
  status: string;
  draftId?: string | null;
}

export function QueueRowActions({ itemId, status, draftId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRemove = () => {
    if (!confirm("Remove this post from the queue? The draft will be kept.")) return;
    startTransition(async () => {
      await removeQueueItemAction(itemId);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {draftId && (
        <a
          href={`/drafts/${draftId}`}
          id={`btn-preview-${itemId}`}
          title="Preview draft"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            color: "#4F46E5",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Eye size={14} />
        </a>
      )}
      {status === "queued" && (
        <button
          id={`btn-remove-${itemId}`}
          title="Remove from queue (keeps draft)"
          onClick={handleRemove}
          disabled={isPending}
          style={{
            width: "32px",
            height: "32px",
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
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
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
        padding: "10px 18px",
        background: paused ? "#ECFDF5" : "#FFFBEB",
        border: `1px solid ${paused ? "#10B981" : "#FDE68A"}`,
        borderRadius: "10px",
        color: paused ? "#059669" : "#D97706",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.7 : 1,
        transition: "all 0.15s ease",
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
