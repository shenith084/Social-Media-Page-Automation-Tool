import { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { db } from "@/lib/db";
import { pages, pageConnections, scheduleSettings, testPosts, pageSettings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SettingsEditor } from "@/components/admin/settings-editor";

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

      {/* Interactive Settings Editor */}
      <SettingsEditor
        pageId={activePage?.id || ""}
        pageName={activePage?.name || "Connected Facebook Page"}
        platformPageId={activePage?.platformPageId || "Pending"}
        connectionStatus={connection?.status || "Connected"}
        latestTestPostStatus={latestTestPost?.status || null}
        latestTestPostDate={latestTestPost ? new Date(latestTestPost.updatedAt).toLocaleDateString("en-GB") : null}
        initialMode={(schedule?.mode as any) || "interval"}
        initialAllowedWeekdays={schedule?.allowedWeekdays || [1, 2, 3, 4, 5]}
        initialDailySlotTimes={schedule?.dailySlotTimes || ["09:00", "13:00", "19:00"]}
        initialIntervalGapMinutes={schedule?.intervalGapMinutes || 120}
        initialAllowedHoursStart={schedule?.allowedHoursStart || "09:00"}
        initialAllowedHoursEnd={schedule?.allowedHoursEnd || "19:00"}
        initialMinimumSpacingMinutes={schedule?.minimumSpacingMinutes || 120}
        initialTimezone={pSetting?.timezone || "Europe/London"}
      />
    </div>
  );
}
