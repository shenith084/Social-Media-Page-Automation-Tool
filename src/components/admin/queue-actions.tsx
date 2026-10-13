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
    <div style={{ display: "flex", gap: "6px" }}>
      {draftId && (
        <a
          href={`/drafts/${draftId}`}
          id={`btn-preview-${itemId}`}
          title="Preview draft"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <Eye size={13} />
        </a>
      )}
      {status === "queued" && (
        <button
          id={`btn-remove-${itemId}`}
          title="Remove from queue (keeps draft)"
          onClick={handleRemove}
          disabled={isPending}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "rgba(239,68,68,0.7)",
            cursor: isPending ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
      {status === "needs_review" && (
        <a
          href="/recovery"
          id={`btn-resolve-${itemId}`}
          style={{
            padding: "5px 10px",
            borderRadius: "6px",
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "rgb(167,139,250)",
            fontSize: "0.75rem",
            fontWeight: 500,
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
        gap: "6px",
        padding: "10px 16px",
        background: paused ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
        border: `1px solid ${paused ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
        borderRadius: "8px",
        color: paused ? "rgb(34,197,94)" : "rgb(234,179,8)",
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : paused ? (
        <Play size={14} />
      ) : (
        <Pause size={14} />
      )}
      {paused ? "Resume Queue" : "Pause Queue"}
    </button>
  );
}