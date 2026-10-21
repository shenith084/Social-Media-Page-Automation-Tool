"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  HelpCircle,
  Trash2,
} from "lucide-react";

export type DialogVariant = "danger" | "warning" | "primary" | "info" | "success";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: "trash" | "warning" | "info" | "help";
}

export interface AlertOptions {
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  buttonText?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
  showToast: (message: string, type?: "info" | "success" | "warning" | "error") => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  // Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  // Alert Modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: () => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: {
          title: opts.title ?? (opts.variant === "danger" ? "Confirm Action" : "Please Confirm"),
          confirmText: opts.confirmText ?? (opts.variant === "danger" ? "Yes, Delete" : "Confirm"),
          cancelText: opts.cancelText ?? "Cancel",
          variant: opts.variant ?? "primary",
          icon: opts.icon,
          message: opts.message,
        },
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    const opts: AlertOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options: {
          title: opts.title ?? (opts.type === "error" ? "Action Failed" : opts.type === "warning" ? "Notice" : "Information"),
          type: opts.type ?? "info",
          buttonText: opts.buttonText ?? "OK",
          message: opts.message,
        },
        resolve,
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: "info" | "success" | "warning" | "error" = "success") => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const handleAlertClose = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  };

  // Keyboard navigation (Escape closes, Enter confirms)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmState) handleConfirmClose(false);
        else if (alertState) handleAlertClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmState, alertState]);

  return (
    <DialogContext.Provider value={{ confirm, alert, showToast }}>
      {children}

      {/* ── Confirm Popup Modal ── */}
      {confirmState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            animation: "fadeInOverlay 0.18s ease-out",
          }}
          onClick={() => handleConfirmClose(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#FFFFFF",
              borderRadius: "18px",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              animation: "slideUpDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    confirmState.options.variant === "danger"
                      ? "#FEE2E2"
                      : confirmState.options.variant === "warning"
                      ? "#FEF3C7"
                      : "#EEF2FF",
                  color:
                    confirmState.options.variant === "danger"
                      ? "#DC2626"
                      : confirmState.options.variant === "warning"
                      ? "#D97706"
                      : "#4F46E5",
                }}
              >
                {confirmState.options.variant === "danger" ? (
                  confirmState.options.icon === "trash" ? <Trash2 size={22} /> : <AlertTriangle size={22} />
                ) : confirmState.options.variant === "warning" ? (
                  <AlertTriangle size={22} />
                ) : (
                  <HelpCircle size={22} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: "0 0 6px",
                    lineHeight: 1.3,
                  }}
                >
                  {confirmState.options.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#475569",
                    margin: 0,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {confirmState.options.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#94A3B8",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                paddingTop: "6px",
              }}
            >
              <button
                type="button"
                id="btn-dialog-cancel"
                onClick={() => handleConfirmClose(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                {confirmState.options.cancelText}
              </button>

              <button
                type="button"
                id="btn-dialog-confirm"
                onClick={() => handleConfirmClose(true)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    confirmState.options.variant === "danger"
                      ? "#DC2626"
                      : confirmState.options.variant === "warning"
                      ? "#D97706"
                      : "#4F46E5",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  boxShadow:
                    confirmState.options.variant === "danger"
                      ? "0 2px 8px rgba(220, 38, 38, 0.35)"
                      : "0 2px 8px rgba(79, 70, 229, 0.35)",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {confirmState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Popup Modal ── */}
      {alertState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            animation: "fadeInOverlay 0.18s ease-out",
          }}
          onClick={handleAlertClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#FFFFFF",
              borderRadius: "18px",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              animation: "slideUpDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    alertState.options.type === "error"
                      ? "#FEE2E2"
                      : alertState.options.type === "warning"
                      ? "#FEF3C7"
                      : alertState.options.type === "success"
                      ? "#DCFCE7"
                      : "#EEF2FF",
                  color:
                    alertState.options.type === "error"
                      ? "#DC2626"
                      : alertState.options.type === "warning"
                      ? "#D97706"
                      : alertState.options.type === "success"
                      ? "#16A34A"
                      : "#4F46E5",
                }}
              >
                {alertState.options.type === "error" ? (
                  <AlertCircle size={22} />
                ) : alertState.options.type === "warning" ? (
                  <AlertTriangle size={22} />
                ) : alertState.options.type === "success" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <Info size={22} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: "0 0 6px",
                    lineHeight: 1.3,
                  }}
                >
                  {alertState.options.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#475569",
                    margin: 0,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {alertState.options.message}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAlertClose}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#94A3B8",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
              <button
                type="button"
                id="btn-dialog-alert-ok"
                onClick={handleAlertClose}
                style={{
                  padding: "9px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {alertState.options.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Floating Toast Notifications ── */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "380px",
            width: "calc(100% - 48px)",
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animation: "slideUpDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {t.type === "success" ? (
                <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
              ) : t.type === "error" ? (
                <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              ) : t.type === "warning" ? (
                <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
              ) : (
                <Info size={18} color="#4F46E5" style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: "0.875rem", color: "#1E293B", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
                {t.message}
              </span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px",
                  cursor: "pointer",
                  color: "#94A3B8",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DialogContext.Provider>
  );
}
