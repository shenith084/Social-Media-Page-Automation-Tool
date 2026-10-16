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
          gap: "7px",
          padding: "9px 18px",
          background: "linear-gradient(135deg, #2563EB, #3B82F6)",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: isPending ? "wait" : "pointer",
          boxShadow: "0 1px 3px rgba(59,130,246,0.3)",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 0.15s ease",
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
            color: statusType === "success" ? "#16A34A" : "#DC2626",
            padding: "4px 10px",
            borderRadius: "6px",
            background: statusType === "success" ? "#DCFCE7" : "#FEE2E2",
            fontWeight: 500,
          }}
        >
          {statusType === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {statusMessage}
        </span>
      )}
    </div>
  );
}