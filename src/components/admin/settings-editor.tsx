"use client";

import { useState } from "react";
import {
  Wifi,
  CheckCircle2,
  Clock,
  Save,
  RotateCcw,
  Send,
  Loader2,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import {
  updateScheduleSettingsAction,
  rebuildScheduleAction,
  runTestPostProofAction,
} from "@/app/actions/settings";
import { useSession } from "@/lib/auth-client";

interface SettingsEditorProps {
  pageId: string;
  pageName: string;
  platformPageId: string;
  connectionStatus: string;
  latestTestPostStatus: string | null;
  latestTestPostDate: string | null;
  initialMode: "fixed_slots" | "interval";
  initialAllowedWeekdays: number[];
  initialDailySlotTimes: string[];
  initialIntervalGapMinutes: number;
  initialAllowedHoursStart: string;
  initialAllowedHoursEnd: string;
  initialMinimumSpacingMinutes: number;
  initialTimezone: string;
}

const WEEKDAYS = [
  { id: 1, label: "Mon", full: "Monday" },
  { id: 2, label: "Tue", full: "Tuesday" },
  { id: 3, label: "Wed", full: "Wednesday" },
  { id: 4, label: "Thu", full: "Thursday" },
  { id: 5, label: "Fri", full: "Friday" },
  { id: 6, label: "Sat", full: "Saturday" },
  { id: 7, label: "Sun", full: "Sunday" },
];

export function SettingsEditor({
  pageId,
  pageName,
  platformPageId,
  connectionStatus,
  latestTestPostStatus,
  latestTestPostDate,
  initialMode,
  initialAllowedWeekdays,
  initialDailySlotTimes,
  initialIntervalGapMinutes,
  initialAllowedHoursStart,
  initialAllowedHoursEnd,
  initialMinimumSpacingMinutes,
  initialTimezone,
}: SettingsEditorProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "admin";
  const canEdit = userRole === "admin" || userRole === "super_admin";

  const [mode, setMode] = useState<"fixed_slots" | "interval">(initialMode || "fixed_slots");
  const [allowedWeekdays, setAllowedWeekdays] = useState<number[]>(initialAllowedWeekdays || [1, 2, 3, 4, 5]);
  const [dailySlotTimes, setDailySlotTimes] = useState<string[]>(initialDailySlotTimes || ["09:00", "13:00", "19:00"]);
  const [newSlotTime, setNewSlotTime] = useState("12:00");
  const [intervalGapMinutes, setIntervalGapMinutes] = useState(initialIntervalGapMinutes || 120);
  const [allowedHoursStart, setAllowedHoursStart] = useState(initialAllowedHoursStart || "09:00");
  const [allowedHoursEnd, setAllowedHoursEnd] = useState(initialAllowedHoursEnd || "19:00");
  const [minimumSpacingMinutes, setMinimumSpacingMinutes] = useState(initialMinimumSpacingMinutes || 30);
  const [timezone, setTimezone] = useState(initialTimezone || "Europe/London");

  const [isSaving, setIsSaving] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isRunningTestPost, setIsRunningTestPost] = useState(false);
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const toggleWeekday = (dayId: number) => {
    if (!canEdit) return;
    setAllowedWeekdays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const addSlotTime = () => {
    if (!canEdit) return;
    if (!dailySlotTimes.includes(newSlotTime)) {
      setDailySlotTimes([...dailySlotTimes, newSlotTime].sort());
    }
  };

  const removeSlotTime = (timeToRemove: string) => {
    if (!canEdit) return;
    setDailySlotTimes(dailySlotTimes.filter((t) => t !== timeToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSaving(true);
    setBannerMessage(null);

    const res = await updateScheduleSettingsAction(pageId, {
      mode,
      allowedWeekdays,
      dailySlotTimes,
      intervalGapMinutes: Number(intervalGapMinutes),
      allowedHoursStart,
      allowedHoursEnd,
      minimumSpacingMinutes: Number(minimumSpacingMinutes),
      timezone,
    });

    setIsSaving(false);
    if (res.success) {
      setBannerMessage({ text: "Schedule settings successfully saved!", type: "success" });
    } else {
      setBannerMessage({ text: res.error || "Failed to save settings.", type: "error" });
    }
  };

  const handleRebuildSchedule = async () => {
    if (!canEdit) return;
    setIsRebuilding(true);
    setShowRebuildModal(false);
    setBannerMessage(null);

    const res = await rebuildScheduleAction(pageId);
    setIsRebuilding(false);

    if (res.success) {
      setBannerMessage({
        text: `Schedule rebuilt! Recalculated slots for ${res.count ?? 0} queued posts.`,
        type: "success",
      });
    } else {
      setBannerMessage({ text: res.error || "Failed to rebuild schedule.", type: "error" });
    }
  };

  const handleRunTestPost = async () => {
    if (!canEdit) return;
    setIsRunningTestPost(true);
    setBannerMessage(null);

    const res = await runTestPostProofAction(pageId);
    setIsRunningTestPost(false);

    if (res.success) {
      setBannerMessage({
        text: "Test post published to Facebook! Queue publishing is now unlocked.",
        type: "success",
      });
    } else {
      setBannerMessage({ text: res.error || "Failed to publish test post.", type: "error" });
    }
  };

  return (
    <div>
      {/* Banner Message */}
      {bannerMessage && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: bannerMessage.type === "success" ? "#DCFCE7" : "#FEE2E2",
            border: `1px solid ${bannerMessage.type === "success" ? "#86EFAC" : "#FCA5A5"}`,
            color: bannerMessage.type === "success" ? "#166534" : "#991B1B",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {bannerMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {bannerMessage.text}
        </div>
      )}

      {/* Editor role alert if read-only */}
      {!canEdit && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#F1F5F9",
            border: "1px solid #CBD5E1",
            color: "#475569",
            fontSize: "0.84rem",
          }}
        >
          <Lock size={16} />
          <span>You are logged in as an <strong>Editor</strong>. Settings are view-only. Only Super Admins and Admins can modify schedule parameters.</span>
        </div>
      )}

      {/* Facebook Page Connection Card */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <Wifi size={17} color="#10B981" />
          Facebook Page Connection
        </h2>

        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <CheckCircle2 size={24} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0F172A" }}>
                {pageName}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px" }}>
                Page ID: {platformPageId} &bull; Timezone Authority: {timezone}
              </div>
            </div>
            <span style={{
              marginLeft: "auto",
              background: "#DCFCE7",
              color: "#16A34A",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "9999px",
            }}>
              {connectionStatus}
            </span>
          </div>

          {/* Test Post Verification Banner */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "#EEF2FF",
            border: "1px solid #E0E7FF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1E1B4B" }}>
                Workflow 1 Setup Proof (Test Post)
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#4F46E5", marginTop: "2px" }}>
                {latestTestPostStatus === "confirmed"
                  ? `Verified on ${latestTestPostDate}. Publishing queue is unlocked.`
                  : "Queue requires a successful controlled test post proof before automatic publishing is enabled."}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                background: latestTestPostStatus === "confirmed" ? "#DCFCE7" : "#E0F2FE",
                color: latestTestPostStatus === "confirmed" ? "#16A34A" : "#0284C7",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "9999px",
              }}>
                {latestTestPostStatus === "confirmed" ? "Access Proven" : "Test Required"}
              </span>

              {canEdit && (
                <button
                  type="button"
                  onClick={handleRunTestPost}
                  disabled={isRunningTestPost}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    background: "#4F46E5",
                    color: "white",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: isRunningTestPost ? "not-allowed" : "pointer",
                  }}
                >
                  {isRunningTestPost ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Run Test Post Proof
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Configuration Form */}
      <section>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}>
          <h2 style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#0F172A",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}>
            <Clock size={17} color="#6366F1" />
            Publishing Schedule Rules
          </h2>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowRebuildModal(true)}
              disabled={isRebuilding}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                background: "#F8FAFC",
                color: "#475569",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: isRebuilding ? "not-allowed" : "pointer",
              }}
            >
              {isRebuilding ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Rebuild Upcoming Schedule
            </button>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "26px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}>
            {/* 1. Mode Switcher */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "8px" }}>
                Publishing Mode
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setMode("fixed_slots")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: mode === "fixed_slots" ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                    background: mode === "fixed_slots" ? "#EEF2FF" : "#FFFFFF",
                    color: mode === "fixed_slots" ? "#4F46E5" : "#64748B",
                    fontWeight: mode === "fixed_slots" ? 700 : 500,
                    cursor: canEdit ? "pointer" : "default",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "0.9375rem" }}>Fixed Daily Slots</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "2px", opacity: 0.85 }}>
                    Posts are published at specific predetermined daily times (e.g. 09:00, 13:00, 19:00).
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setMode("interval")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: mode === "interval" ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                    background: mode === "interval" ? "#EEF2FF" : "#FFFFFF",
                    color: mode === "interval" ? "#4F46E5" : "#64748B",
                    fontWeight: mode === "interval" ? 700 : 500,
                    cursor: canEdit ? "pointer" : "default",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "0.9375rem" }}>Interval Mode</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "2px", opacity: 0.85 }}>
                    Posts are spaced out by a regular minute gap within allowed operating hours.
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Allowed Weekdays */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "8px" }}>
                Allowed Publishing Days
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {WEEKDAYS.map((day) => {
                  const isSelected = allowedWeekdays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleWeekday(day.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: isSelected ? "1px solid #4F46E5" : "1px solid #E2E8F0",
                        background: isSelected ? "#4F46E5" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#475569",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        cursor: canEdit ? "pointer" : "default",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Conditional Mode Settings */}
            {mode === "fixed_slots" ? (
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "8px" }}>
                  Daily Slot Times (UK Local Time)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {dailySlotTimes.map((slot) => (
                    <span
                      key={slot}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        background: "#EEF2FF",
                        color: "#4F46E5",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        border: "1px solid #C7D2FE",
                      }}
                    >
                      <Clock size={13} />
                      {slot}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeSlotTime(slot)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#6366F1",
                            cursor: "pointer",
                            padding: 0,
                            marginLeft: "4px",
                            display: "flex",
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canEdit && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", maxWidth: "260px" }}>
                    <input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.875rem",
                        flex: 1,
                      }}
                    />
                    <button
                      type="button"
                      onClick={addSlotTime}
                      style={{
                        padding: "7px 14px",
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={14} /> Add Slot
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                    Interval Gap (Minutes)
                  </label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={intervalGapMinutes}
                    onChange={(e) => setIntervalGapMinutes(Number(e.target.value))}
                    min={15}
                    max={1440}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                    Operating Window Start
                  </label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={allowedHoursStart}
                    onChange={(e) => setAllowedHoursStart(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                    Operating Window End
                  </label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={allowedHoursEnd}
                    onChange={(e) => setAllowedHoursEnd(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 4. Spacing & Timezone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                  Minimum Spacing Between Posts (Minutes)
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={minimumSpacingMinutes}
                  onChange={(e) => setMinimumSpacingMinutes(Number(e.target.value))}
                  min={10}
                  max={720}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                  Timezone Authority
                </label>
                <select
                  disabled={!canEdit}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="Europe/London">Europe/London (GMT/BST aware)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (US Eastern)</option>
                  <option value="Asia/Colombo">Asia/Colombo (Sri Lanka / IST)</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            {canEdit && (
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 22px",
                    background: "#4F46E5",
                    color: "white",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
                  }}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Schedule Settings
                </button>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Confirmation Modal for Schedule Rebuild */}
      {showRebuildModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "26px",
            maxWidth: "460px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
              Rebuild Upcoming Schedule?
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748B", lineHeight: 1.5, margin: "0 0 20px" }}>
              This action will recalculate upcoming unclaimed slots for all queued posts based on your updated settings.
              Published posts and in-progress jobs will not be affected.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowRebuildModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRebuildSchedule}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, Rebuild Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
