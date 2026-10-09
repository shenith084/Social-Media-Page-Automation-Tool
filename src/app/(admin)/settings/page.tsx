import { Metadata } from "next";
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Settings } from "lucide-react";

export const metadata: Metadata = { title: "Page & Schedule Settings" };

export default function SettingsPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "800px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>
          Page & Schedule Settings
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Configure your Facebook Page connection and publishing schedule.
        </p>
      </div>

      {/* ── Page Connection ─────────── */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Wifi size={16} style={{ color: "rgb(34,197,94)" }} />
          Facebook Page Connection
        </h2>

        <div className="glass-card-elevated" style={{ padding: "20px" }}>
          {/* Connected state */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={20} style={{ color: "rgb(34,197,94)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Pixzora Labs · Demo Page</div>
              <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
                Page ID: 123456789 · Token expires: 30 Nov 2026
              </div>
            </div>
            <span className="badge badge-approved" style={{ marginLeft: "auto" }}>Connected</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="btn-reconnect-page"
              style={{
                padding: "8px 16px",
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "6px",
                color: "rgb(96,165,250)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reconnect / Refresh Token
            </button>
            <button
              id="btn-test-post"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              Send Test Post
            </button>
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "10px 12px",
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            ⚠ Publishing queue is only enabled after a successful test post. The test post is isolated from your production queue and will be clearly labelled.
          </div>
        </div>
      </section>

      {/* ── Timezone ─────────── */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>Timezone</h2>
        <div className="glass-card-elevated" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="timezone" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}>
                Publishing timezone
              </label>
              <select
                id="timezone"
                defaultValue="Europe/London"
                style={{
                  padding: "9px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.875rem",
                  outline: "none",
                  width: "100%",
                  maxWidth: "360px",
                }}
              >
                <option value="Europe/London" style={{ background: "rgb(22,22,42)" }}>Europe/London (GMT/BST)</option>
                <option value="Europe/Paris" style={{ background: "rgb(22,22,42)" }}>Europe/Paris (CET/CEST)</option>
                <option value="America/New_York" style={{ background: "rgb(22,22,42)" }}>America/New_York (EST/EDT)</option>
              </select>
            </div>
          </div>
          <p style={{ marginTop: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
            All scheduled times are displayed in this timezone. UTC instants are stored in the database.
            GMT/BST transitions are handled automatically.
          </p>
        </div>
      </section>

      {/* ── Schedule Mode ─────────── */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>Publishing Schedule</h2>
        <div className="glass-card-elevated" style={{ padding: "20px" }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[
              { id: "mode-fixed", value: "fixed_slots", label: "Fixed Slots", desc: "Publish at specific times each day" },
              { id: "mode-interval", value: "interval", label: "Interval", desc: "Publish every N hours" },
            ].map((mode) => (
              <label
                key={mode.id}
                htmlFor={mode.id}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: mode.value === "fixed_slots"
                    ? "1px solid rgba(139,92,246,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  background: mode.value === "fixed_slots"
                    ? "rgba(139,92,246,0.1)"
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  id={mode.id}
                  name="scheduleMode"
                  value={mode.value}
                  defaultChecked={mode.value === "fixed_slots"}
                  style={{ accentColor: "rgb(139,92,246)", marginRight: "8px" }}
                />
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{mode.label}</span>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", marginLeft: "24px" }}>
                  {mode.desc}
                </p>
              </label>
            ))}
          </div>

          {/* Allowed weekdays */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "10px" }}>
              Allowed days
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <label key={day} htmlFor={`day-${day}`} style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    defaultChecked={i < 5}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "8px",
                      background: i < 5 ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                      border: i < 5 ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: i < 5 ? 600 : 400,
                      color: i < 5 ? "rgb(167,139,250)" : "rgba(255,255,255,0.3)",
                      transition: "all 0.15s",
                    }}
                  >
                    {day}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Slot times */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "10px" }}>
              Daily slot times (UK local)
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {["09:00", "13:00", "19:00"].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    color: "rgb(167,139,250)",
                  }}
                >
                  {t}
                  <button
                    style={{ background: "none", border: "none", color: "rgba(167,139,250,0.5)", cursor: "pointer", padding: "0", lineHeight: 1 }}
                    title="Remove slot"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                id="btn-add-slot"
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                + Add slot
              </button>
            </div>
          </div>

          {/* Min spacing */}
          <div>
            <label htmlFor="min-spacing" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}>
              Minimum spacing between posts (minutes)
            </label>
            <input
              id="min-spacing"
              type="number"
              defaultValue={30}
              min={0}
              style={{
                padding: "9px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                width: "140px",
              }}
            />
          </div>
        </div>
      </section>

      {/* Save + Rebuild buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          id="btn-save-settings"
          style={{
            padding: "11px 24px",
            background: "linear-gradient(135deg, rgb(139,92,246), rgb(109,40,217))",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
          }}
        >
          Save Settings
        </button>
        <button
          id="btn-rebuild-schedule"
          style={{
            padding: "11px 20px",
            background: "rgba(234,179,8,0.1)",
            border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: "8px",
            color: "rgb(234,179,8)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Rebuild Upcoming Schedule…
        </button>
      </div>
      <p style={{ marginTop: "10px", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
        Saving preserves existing reservations. Use "Rebuild Upcoming Schedule" to reassign unclaimed
        future slots — a before/after diff will be shown for confirmation.
      </p>
    </div>
  );
}
