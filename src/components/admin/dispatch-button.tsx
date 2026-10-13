"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { manualDispatchAction } from "@/app/actions/dispatch";
import { useRouter } from "next/navigation";

export function ManualDispatchButton() {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info" | null>(null);
  const router = useRouter();

  const handleDispatch = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await manualDispatchAction();
      if (res.success) {
        setStatusType("success");
        setStatusMessage(res.message || "Dispatch tick executed successfully!");
        router.refresh();
      } else {
        setStatusType("error");
        setStatusMessage(res.error || "Dispatch failed");
      }

      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 5000);
    });
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <button
        id="btn-manual-dispatch"
        onClick={handleDispatch}
        disabled={isPending}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 18px",
          background: "linear-gradient(135deg, rgb(59,130,246), rgb(37,99,235))",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: isPending ? "wait" : "pointer",
          boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {isPending ? "Dispatching..." : "Publish Next"}
      </button>

      {statusMessage && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8125rem",
            color: statusType === "success" ? "rgb(34,197,94)" : "rgb(239,68,68)",
            padding: "4px 8px",
            borderRadius: "6px",
            background:
              statusType === "success"
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
          }}
        >
          {statusType === "success" ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertCircle size={13} />
          )}
          {statusMessage}
        </span>
      )}
    </div>
  );
}