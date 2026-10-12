import { Metadata } from "next";
import { Wifi, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { pages, pageConnections, scheduleSettings, testPosts, pageSettings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Page & Schedule Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const pageList = await db.select().from(pages).limit(1);
  const activePage = pageList[0];

  const connections = activePage
    ? await db.select().from(pageConnections).where(eq(pageConnections.pageId, activePage.id)).limit(1)
    : [];
  const connection = connections[0];

  const pSettings = activePage
    ? await db.select().from(pageSettings).where(eq(pageSettings.pageId, activePage.id)).limit(1)
    : [];
  const pSetting = pSettings[0];

  const schedSettings = activePage
    ? await db.select().from(scheduleSettings).where(eq(scheduleSettings.pageId, activePage.id)).limit(1)
    : [];
  const schedule = schedSettings[0];

  const recentTestPosts = activePage
    ? await db.select().from(testPosts).where(eq(testPosts.pageId, activePage.id)).orderBy(desc(testPosts.createdAt)).limit(1)
    : [];
  const latestTestPost = recentTestPosts[0];

  return (
    <div style={{ padding: "32px", maxWidth: "800px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px" }}>
          Page & Schedule Settings
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Configure Facebook Page connection, controlled test post proof, and publishing schedule.
        </p>
      </div>

      {/* Facebook Page Connection */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Wifi size={16} style={{ color: "rgb(34,197,94)" }} />
          Facebook Page Connection
        </h2>

        <div className="glass-card-elevated" style={{ padding: "20px" }}>
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
              <div style={{ fontWeight: 600 }}>{activePage?.name || "Connected Facebook Page"}</div>
              <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
                Page ID: {activePage?.platformPageId || "Pending"} &bull; Timezone: {pSetting?.timezone || "Europe/London"}
              </div>
            </div>
            <span className="badge badge-approved" style={{ marginLeft: "auto" }}>
              {connection?.status || "Connected"}
            </span>
          </div>

          {/* Test Post Verification Banner */}
          <div
            style={{
              padding: "14px",
              borderRadius: "8px",
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                Workflow 1 Setup Proof (Test Post)
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                {latestTestPost?.status === "confirmed"
                  ? `Verified on ${new Date(latestTestPost.updatedAt).toLocaleDateString("en-GB")}. Publishing queue is unlocked.`
                  : "Queue requires a successful controlled test post proof before automatic publishing is enabled."}
              </div>
            </div>
            <span className="badge badge-queued">
              {latestTestPost?.status === "confirmed" ? "Access Proven" : "Test Required"}
            </span>
          </div>
        </div>
      </section>

      {/* Schedule Configuration */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={16} style={{ color: "rgb(139,92,246)" }} />
          Publishing Schedule Rules
        </h2>

        <div className="glass-card-elevated" style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Publishing Mode</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                {schedule?.mode === "fixed_slots" ? "Fixed Daily Slots" : "Interval Mode"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Timezone Authority</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                {pSetting?.timezone || "Europe/London"} (GMT/BST aware)
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Allowed Days</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                Monday &ndash; Friday (Weekdays)
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Minimum Spacing</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                {schedule?.minimumSpacingMinutes || 120} minutes
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Changes to scheduling parameters preserve existing reservations. To recalculate upcoming unclaimed slots, use the schedule rebuild action.
          </div>
        </div>
      </section>
    </div>
  );
}
