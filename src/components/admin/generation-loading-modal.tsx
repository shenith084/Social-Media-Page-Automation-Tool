"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Brain,
  Wand2,
  Hash,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lightbulb,
  Clock,
  Zap,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  topic: string;
  tone: string;
  audience?: string;
  postCount: number;
  isSuccess: boolean;
  error?: string | null;
  onClose?: () => void;
}

const MARKETING_TIPS = [
  "Pixzora AI automatically formats copy and spelling in British English (e.g. specialise, colour).",
  "Posts with 3 to 5 targeted hashtags achieve up to 40% higher organic visibility.",
  "Hook formulas in the first 2 lines determine whether users click 'See More' on social feeds.",
  "Your generated drafts are completely private until approved and scheduled in your queue.",
  "Drafts can be fine-tuned or regenerated at any time in the Draft Library.",
];

export function GenerationLoadingModal({
  isOpen,
  topic,
  tone,
  audience,
  postCount,
  isSuccess,
  error,
  onClose,
}: Props) {
  const [progress, setProgress] = useState(12);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Elapsed timer & rotating tips
  useEffect(() => {
    if (!isOpen || isSuccess || error) return;

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % MARKETING_TIPS.length);
    }, 3200);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [isOpen, isSuccess, error]);

  // Smooth progress increment
  useEffect(() => {
    if (!isOpen) {
      setProgress(12);
      setElapsed(0);
      return;
    }

    if (isSuccess) {
      setProgress(100);
      return;
    }

    if (error) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 35) return prev + Math.floor(Math.random() * 8 + 4);
        if (prev < 65) return prev + Math.floor(Math.random() * 5 + 3);
        if (prev < 88) return prev + Math.floor(Math.random() * 3 + 1);
        if (prev < 96) return prev + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(progressTimer);
  }, [isOpen, isSuccess, error]);

  if (!isOpen) return null;

  // Pipeline step status calculation
  const getStepStatus = (stepIndex: number) => {
    if (isSuccess) return "complete";
    if (error) return stepIndex === 1 ? "failed" : "waiting";

    if (stepIndex === 1) return progress >= 30 ? "complete" : "active";
    if (stepIndex === 2) return progress >= 65 ? "complete" : progress >= 30 ? "active" : "waiting";
    if (stepIndex === 3) return progress >= 88 ? "complete" : progress >= 65 ? "active" : "waiting";
    if (stepIndex === 4) return progress >= 96 ? "complete" : progress >= 88 ? "active" : "waiting";
    return "waiting";
  };

  const steps = [
    {
      index: 1,
      title: "Strategy & Concept Formulation",
      desc: `Calibrating ${tone} tone and target audience context`,
      icon: Brain,
    },
    {
      index: 2,
      title: "AI Copy Synthesis (Gemini 3 Flash)",
      desc: "Composing engaging hook, body copy, and CTA in British English",
      icon: Wand2,
    },
    {
      index: 3,
      title: "Hashtags & Headline Architecture",
      desc: "Curating high-reach hashtags and punchy card headlines",
      icon: Hash,
    },
    {
      index: 4,
      title: "Draft Assembly & Library Storage",
      desc: `Saving ${postCount} draft record${postCount > 1 ? "s" : ""} ready for review`,
      icon: Zap,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmerGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        className="sleek-modal-box"
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          boxShadow: "0 25px 65px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.1)",
          overflow: "hidden",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Top ambient banner */}
        <div
          style={{
            background: isSuccess
              ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
              : error
              ? "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)"
              : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
            padding: "30px 28px 24px",
            color: "#FFFFFF",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Animated background glow overlay */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%)",
              animation: "spinSlow 14s linear infinite",
              pointerEvents: "none",
            }}
          />

          {/* Glowing Center Orb */}
          <div
            style={{
              position: "relative",
              width: "72px",
              height: "72px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Outer pulse wave */}
            <div
              style={{
                position: "absolute",
                inset: "-8px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.3)",
                animation: "pulseRing 2s ease-in-out infinite",
              }}
            />

            {/* Inner Core */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: isSuccess
                  ? "#059669"
                  : error
                  ? "#DC2626"
                  : "rgba(255, 255, 255, 0.22)",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              }}
            >
              {isSuccess ? (
                <CheckCircle2 size={40} color="#FFFFFF" />
              ) : error ? (
                <AlertCircle size={40} color="#FFFFFF" />
              ) : (
                <Sparkles size={34} color="#FFFFFF" style={{ animation: "spinSlow 8s linear infinite" }} />
              )}
            </div>
          </div>

          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            {isSuccess
              ? "Content Generated Successfully!"
              : error
              ? "Generation Encountered an Error"
              : "Generating Social Content..."}
          </h2>

          <p
            style={{
              fontSize: "0.875rem",
              margin: "6px auto 0",
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: "420px",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isSuccess
              ? "Drafts prepared. Redirecting to your Drafts Library..."
              : error
              ? error
              : `Topic: "${topic}"`}
          </p>

          {/* Badges Row */}
          {!error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "14px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.2)",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {postCount} Post{postCount > 1 ? "s" : ""}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.2)",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                Tone: {tone}
              </span>
              {audience && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.2)",
                    fontWeight: 600,
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Audience: {audience}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: "26px 28px 28px", background: "#FFFFFF" }}>
          {/* Progress Bar & Counter */}
          {!error && (
            <div style={{ marginBottom: "26px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: "#0F172A",
                  marginBottom: "8px",
                }}
              >
                <span>Pipeline Progress</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#64748B", fontWeight: 400, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> {elapsed}s elapsed
                  </span>
                  <span style={{ color: isSuccess ? "#059669" : "#4F46E5", fontWeight: 700 }}>
                    {progress}%
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#F1F5F9",
                  borderRadius: "999px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: isSuccess
                      ? "linear-gradient(90deg, #059669 0%, #10B981 100%)"
                      : "linear-gradient(90deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
                    borderRadius: "999px",
                    transition: "width 0.35s ease",
                    boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
                  }}
                />
              </div>
            </div>
          )}

          {/* 4 Pipeline Stages */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {steps.map((st) => {
              const status = getStepStatus(st.index);
              const StepIcon = st.icon;

              const isComplete = status === "complete";
              const isActive = status === "active";

              return (
                <div
                  key={st.index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    background: isActive ? "#F5F3FF" : isComplete ? "#F0FDF4" : "#F8FAFC",
                    border: `1px solid ${isActive ? "#DDD6FE" : isComplete ? "#DCFCE7" : "#F1F5F9"}`,
                    transition: "all 0.25s ease",
                  }}
                >
                  {/* Status Indicator Icon */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: isComplete
                        ? "#DCFCE7"
                        : isActive
                        ? "#EDE9FE"
                        : "#E2E8F0",
                      color: isComplete
                        ? "#16A34A"
                        : isActive
                        ? "#6D28D9"
                        : "#94A3B8",
                    }}
                  >
                    {isComplete ? (
                      <CheckCircle2 size={18} />
                    ) : isActive ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <StepIcon size={18} />
                    )}
                  </div>

                  {/* Step Text Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: isComplete ? "#15803D" : isActive ? "#4C1D95" : "#64748B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {st.title}
                      {isActive && (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            background: "#8B5CF6",
                            color: "white",
                            padding: "1px 6px",
                            borderRadius: "999px",
                            fontWeight: 700,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: isActive ? "#6D28D9" : "#64748B",
                        marginTop: "2px",
                      }}
                    >
                      {st.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotating Insight / Tip Banner */}
          {!error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <Lightbulb size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                <strong style={{ color: "#0F172A" }}>Pro Tip: </strong>
                {MARKETING_TIPS[tipIndex]}
              </div>
            </div>
          )}

          {/* Error Action Button */}
          {error && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close & Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
