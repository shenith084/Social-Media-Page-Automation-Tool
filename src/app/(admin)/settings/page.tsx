import { Metadata } from "next";
import { Wifi, CheckCircle2, Clock, CalendarCheck } from "lucide-react";
import { db } from "@/lib/db";
import { pages, pageConnections, scheduleSettings, testPosts, pageSettings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Page & Schedule Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let activePage = await db.query.pages.findFirst({
    where: eq(pages.isActive, true),
  });
  if (!activePage) {
    activePage = (await db.select().from(pages).limit(1))[0];
  }

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
    <div style={{ padding: "26px 36px 40px", maxWidth: "980px" }}>
      {/* Top Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <CalendarCheck size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              Page & Schedule Settings
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Configure Facebook Page connection, controlled test post proof, and publishing schedule.
            </p>
          </div>
        </div>
      </div>

      {/* Facebook Page Connection */}
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

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={24} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0F172A" }}>
                {activePage?.name || "Connected Facebook Page"}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px" }}>
                Page ID: {activePage?.platformPageId || "Pending"} &bull; Timezone: {pSetting?.timezone || "Europe/London"}
              </div>
            </div>
            <span
              style={{
                marginLeft: "auto",
                background: "#DCFCE7",
                color: "#16A34A",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "9999px",
              }}
            >
              {connection?.status || "Connected"}
            </span>
          </div>

          {/* Test Post Verification Banner */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#EEF2FF",
              border: "1px solid #E0E7FF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1E1B4B" }}>
                Workflow 1 Setup Proof (Test Post)
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#4F46E5", marginTop: "2px" }}>
                {latestTestPost?.status === "confirmed"
                  ? `Verified on ${new Date(latestTestPost.updatedAt).toLocaleDateString("en-GB")}. Publishing queue is unlocked.`
                  : "Queue requires a successful controlled test post proof before automatic publishing is enabled."}
              </div>
            </div>
            <span
              style={{
                background: "#E0F2FE",
                color: "#0284C7",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "9999px",
                whiteSpace: "nowrap",
              }}
            >
              {latestTestPost?.status === "confirmed" ? "Access Proven" : "Test Required"}
            </span>
          </div>
        </div>
      </section>

      {/* Schedule Configuration */}
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
          <Clock size={17} color="#6366F1" />
          Publishing Schedule Rules
        </h2>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "22px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Publishing Mode</span>
              <div style={{ fontWeight: 700, color: "#0F172A", marginTop: "4px", fontSize: "0.9375rem" }}>
                {schedule?.mode === "fixed_slots" ? "Fixed Daily Slots" : "Interval Mode"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Timezone Authority</span>
              <div style={{ fontWeight: 700, color: "#0F172A", marginTop: "4px", fontSize: "0.9375rem" }}>
                {pSetting?.timezone || "Europe/London"} (GMT/BST aware)
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Allowed Days</span>
              <div style={{ fontWeight: 700, color: "#0F172A", marginTop: "4px", fontSize: "0.9375rem" }}>
                Monday &ndash; Friday (Weekdays)
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Minimum Spacing</span>
              <div style={{ fontWeight: 700, color: "#0F172A", marginTop: "4px", fontSize: "0.9375rem" }}>
                {schedule?.minimumSpacingMinutes || 120} minutes
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "14px 16px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              fontSize: "0.8125rem",
              color: "#64748B",
              lineHeight: 1.5,
            }}
          >
            Changes to scheduling parameters preserve existing reservations. To recalculate upcoming unclaimed slots, use the schedule rebuild action.
          </div>
        </div>
      </section>
    </div>
  );
}

