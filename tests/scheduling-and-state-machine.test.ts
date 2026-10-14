import {
  assignSlots,
  localTimeToUTC,
  rollToNextAllowedWindow,
  ScheduleSettings,
  DEFAULT_TIMEZONE,
} from "../src/lib/scheduling/engine";
import { JOB_TRANSITIONS, JobStatus } from "../src/lib/state-machines/job-state-machine";
import { formatInTimeZone } from "date-fns-tz";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("PIXZORA SOCIAL AUTOMATION - ACCEPTANCE TEST SUITE");
  console.log("=================================================\n");

  // TEST 1: A to E Example Allocation (Section 1.6 & 7)
  console.log("--- TEST 1: Section 1.6 A to E Batch Allocation ---");
  const fixedSettings: ScheduleSettings = {
    mode: "fixed_slots",
    timezone: "Europe/London",
    allowedWeekdays: [1, 2, 3, 4, 5], // Mon-Fri
    dailySlotTimes: ["09:00", "13:00", "19:00"],
    minimumSpacingMinutes: 120,
  };

  // Base date: Monday 2026-06-08 at 08:00 UK local time (before 09:00)
  // In June, London is BST (UTC+1), so 08:00 BST is 07:00 UTC
  const fromUtc = new Date("2026-06-08T07:00:00.000Z");
  const draftIds = ["draft-A", "draft-B", "draft-C", "draft-D", "draft-E"];

  const batchSlots = assignSlots(fixedSettings, 5, fromUtc);
  assert(batchSlots.length === 5, "5 drafts assigned 5 slots");

  const formattedTimes = batchSlots.map((slotUtc, i) => ({
    draftId: draftIds[i],
    ukTime: formatInTimeZone(slotUtc, "Europe/London", "yyyy-MM-dd HH:mm"),
  }));

  console.log("Assigned Slots:", formattedTimes);

  assert(formattedTimes[0].ukTime === "2026-06-08 09:00", "Post A assigned Day 1 09:00");
  assert(formattedTimes[1].ukTime === "2026-06-08 13:00", "Post B assigned Day 1 13:00");
  assert(formattedTimes[2].ukTime === "2026-06-08 19:00", "Post C assigned Day 1 19:00");
  assert(formattedTimes[3].ukTime === "2026-06-09 09:00", "Post D assigned Day 2 09:00");
  assert(formattedTimes[4].ukTime === "2026-06-09 13:00", "Post E assigned Day 2 13:00");

  // TEST 2: DST Transitions (Section 7)
  console.log("\n--- TEST 2: Daylight Saving Time (DST) Vectors ---");
  // Spring Forward: 29 March 2026
  // In UK, 01:00 GMT jumps to 02:00 BST (UTC+1). 13:00 local is 12:00 UTC.
  const springDate = new Date("2026-03-29T00:00:00.000Z");
  const summerUtc = localTimeToUTC(springDate, "13:00", "Europe/London");
  assert(summerUtc.toISOString() === "2026-03-29T12:00:00.000Z", "Spring transition 13:00 BST resolves to 12:00 UTC");

  // Autumn Fall Back: 25 October 2026
  // In UK, 02:00 BST falls back to 01:00 GMT (UTC+0). 13:00 local is 13:00 UTC.
  const winterDate = new Date("2026-10-25T00:00:00.000Z");
  const winterUtc = localTimeToUTC(winterDate, "13:00", "Europe/London");
  assert(winterUtc.toISOString() === "2026-10-25T13:00:00.000Z", "Autumn transition 13:00 GMT resolves to 13:00 UTC");

  // TEST 3: Interval Mode Rollover (Section 7)
  console.log("\n--- TEST 3: Interval Mode Weekend Rollover ---");
  const intervalSettings: ScheduleSettings = {
    mode: "interval",
    timezone: "Europe/London",
    allowedWeekdays: [1, 2, 3, 4, 5], // Mon-Fri
    allowedHoursStart: "09:00",
    allowedHoursEnd: "19:00",
    minimumSpacingMinutes: 120,
  };

  // Friday 2026-06-12 at 22:00 BST (21:00 UTC) -> Outside window, weekend next
  const fridayNightUtc = new Date("2026-06-12T21:00:00.000Z");
  const rolledUtc = rollToNextAllowedWindow(fridayNightUtc, intervalSettings);
  const rolledFormatted = formatInTimeZone(rolledUtc, "Europe/London", "yyyy-MM-dd HH:mm");
  console.log("Rolled from Friday 22:00 BST to:", rolledFormatted);
  assert(rolledFormatted === "2026-06-15 09:00", "Rolled to Monday morning 09:00 BST");

  // TEST 4: Job State Machine Legal Transitions (Section 8.1)
  console.log("\n--- TEST 4: Job State Machine Transition Validity ---");
  function isLegalTransition(from: JobStatus, to: JobStatus): boolean {
    return JOB_TRANSITIONS.some((t) => t.from === from && t.to === to);
  }

  assert(isLegalTransition("queued", "publishing"), "queued -> publishing is LEGAL");
  assert(isLegalTransition("publishing", "published"), "publishing -> published is LEGAL");
  assert(isLegalTransition("publishing", "needs_review"), "publishing -> needs_review is LEGAL");
  assert(isLegalTransition("needs_review", "published"), "needs_review -> published is LEGAL");
  assert(isLegalTransition("needs_review", "publishing"), "needs_review -> publishing (Admin safe retry) is LEGAL");
  assert(isLegalTransition("needs_review", "skipped"), "needs_review -> skipped (Admin skip) is LEGAL");
  assert(!isLegalTransition("published", "queued"), "published -> queued is ILLEGAL");
  assert(!isLegalTransition("queued", "published"), "queued -> published directly is ILLEGAL");
  assert(!isLegalTransition("cancelled", "publishing"), "cancelled -> publishing is ILLEGAL");

  console.log("\n=================================================");
  console.log("ALL ACCEPTANCE UNIT TESTS PASSED SUCCESSFULLY! ??");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});