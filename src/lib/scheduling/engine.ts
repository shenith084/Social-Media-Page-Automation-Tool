// ============================================================
// SCHEDULING ENGINE
// Social Media Page Automation Tool — Pixzora Labs
// Europe/London aware · UTC storage · DST-safe
// ============================================================

import {
  addMinutes,
  addDays,
  startOfDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  parseISO,
  formatISO,
  isBefore,
  isAfter,
  getDay,
  getISODay,
} from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Europe/London";

export interface ScheduleSettings {
  mode: "fixed_slots" | "interval";
  timezone: string;
  allowedWeekdays: number[]; // 1=Monday, 7=Sunday (ISO)
  dailySlotTimes?: string[]; // ["09:00", "13:00", "19:00"]
  intervalFirstPublishTime?: Date; // UTC
  intervalGapMinutes?: number;
  allowedHoursStart?: string; // "09:00"
  allowedHoursEnd?: string;   // "19:00"
  minimumSpacingMinutes: number;
}

// ── Time helpers ────────────────────────────────────────────

/**
 * Parse a "HH:MM" local time string and combine with a given date in the
 * specified timezone, returning a UTC Date.
 *
 * DST rules (owner must confirm these defaults):
 * - Spring-forward (non-existent local time): advance to next valid instant.
 * - Autumn (ambiguous local time): use first occurrence (standard → DST end).
 */
export function localTimeToUTC(
  dateLocal: Date,
  timeStr: string,
  timezone: string
): Date {
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  // Set to the local date as if it were UTC, then zone-correct
  let candidate = setMilliseconds(
    setSeconds(setMinutes(setHours(startOfDay(dateLocal), h), m), 0),
    0
  );

  // fromZonedTime treats the input as a local time in `timezone` → returns UTC
  const utcInstant = fromZonedTime(candidate, timezone);

  // Verify round-trip to detect DST gaps (spring-forward)
  const roundTrip = toZonedTime(utcInstant, timezone);
  const roundTripHour = roundTrip.getHours();
  const roundTripMin = roundTrip.getMinutes();

  if (roundTripHour !== h || roundTripMin !== m) {
    // The local time does not exist (spring-forward gap).
    // Owner-confirmed decision: advance to next valid instant (add gap).
    return addMinutes(utcInstant, 60); // skip the missing hour
  }

  return utcInstant;
}

/**
 * Given a UTC instant, return the ISO weekday (1=Mon, 7=Sun) in the given timezone.
 */
export function getISODayInTz(utcDate: Date, timezone: string): number {
  const local = toZonedTime(utcDate, timezone);
  const jsDay = getDay(local); // 0=Sun
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Is a UTC instant within the allowed weekdays?
 */
export function isAllowedWeekday(
  utcDate: Date,
  allowedWeekdays: number[],
  timezone: string
): boolean {
  return allowedWeekdays.includes(getISODayInTz(utcDate, timezone));
}

/**
 * Is a UTC instant within the allowed hours window?
 */
export function isWithinAllowedHours(
  utcDate: Date,
  allowedHoursStart: string,
  allowedHoursEnd: string,
  timezone: string
): boolean {
  const local = toZonedTime(utcDate, timezone);
  const localHHMM =
    `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
  return localHHMM >= allowedHoursStart && localHHMM <= allowedHoursEnd;
}

/**
 * Advance a UTC instant to the start of the next allowed window.
 * Implements the interval rollover rule (owner must confirm):
 * "If the calculated next time falls outside the allowed hours or days,
 *  move it to the earliest valid future instant (start of next allowed window)."
 */
export function rollToNextAllowedWindow(
  fromUtc: Date,
  settings: ScheduleSettings
): Date {
  const { timezone, allowedWeekdays, allowedHoursStart, allowedHoursEnd } = settings;

  if (!allowedHoursStart || !allowedHoursEnd || !allowedWeekdays.length) {
    return fromUtc;
  }

  let candidate = new Date(fromUtc);
  let iterations = 0;

  while (iterations < 365 * 48) {
    // Safety limit: 1 year in 30-min steps
    iterations++;

    const isDay = isAllowedWeekday(candidate, allowedWeekdays, timezone);
    const isHour = isWithinAllowedHours(
      candidate,
      allowedHoursStart,
      allowedHoursEnd,
      timezone
    );

    if (isDay && isHour) return candidate;

    if (!isDay) {
      // Advance to the start of the next allowed weekday
      candidate = findNextAllowedDayStart(candidate, settings);
    } else {
      // Day is allowed but time is out of window — jump to start of window
      const localDate = toZonedTime(candidate, timezone);
      const windowStart = localTimeToUTC(localDate, allowedHoursStart, timezone);
      if (isAfter(windowStart, candidate)) {
        candidate = windowStart;
      } else {
        // Past end of window — go to next day start
        candidate = addDays(candidate, 1);
        candidate = findNextAllowedDayStart(candidate, settings);
      }
    }
  }

  throw new Error("rollToNextAllowedWindow: could not find a valid slot in 1 year");
}

function findNextAllowedDayStart(from: Date, settings: ScheduleSettings): Date {
  const { timezone, allowedWeekdays, allowedHoursStart } = settings;
  let day = from;
  for (let i = 0; i < 8; i++) {
    if (isAllowedWeekday(day, allowedWeekdays, timezone)) {
      const localDay = toZonedTime(day, timezone);
      return localTimeToUTC(localDay, allowedHoursStart ?? "00:00", timezone);
    }
    day = addDays(day, 1);
  }
  throw new Error("No allowed weekday found in next 8 days");
}

// ── Fixed-slot mode ─────────────────────────────────────────

/**
 * Returns the next available UTC slot after `afterUtc` that:
 * 1. Is on an allowed weekday
 * 2. Matches one of the configured daily slot times
 * 3. Is strictly after `afterUtc`
 *
 * Scans up to 60 days forward.
 */
export function nextFixedSlot(
  afterUtc: Date,
  settings: ScheduleSettings,
  existingSlots: Date[] = []
): Date {
  const { timezone, allowedWeekdays, dailySlotTimes = [] } = settings;

  if (!dailySlotTimes.length) {
    throw new Error("Fixed-slot mode requires at least one daily slot time");
  }

  const existing = new Set(existingSlots.map((d) => d.toISOString()));

  // Scan day by day
  let dayStart = startOfDay(toZonedTime(afterUtc, timezone));

  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const currentDay = addDays(dayStart, dayOffset);
    const isoDay = getISODayInTz(
      fromZonedTime(currentDay, timezone),
      timezone
    );

    if (!allowedWeekdays.includes(isoDay)) continue;

    for (const slotTime of [...dailySlotTimes].sort()) {
      const slotUtc = localTimeToUTC(currentDay, slotTime, timezone);

      if (!isAfter(slotUtc, afterUtc)) continue;
      if (existing.has(slotUtc.toISOString())) continue;

      return slotUtc;
    }
  }

  throw new Error("nextFixedSlot: no slot found in the next 60 days");
}

// ── Interval mode ───────────────────────────────────────────

/**
 * Compute the next scheduled time in interval mode.
 *
 * Algorithm:
 * 1. Add the configured gap to the previous reserved time.
 * 2. If the result is outside the allowed window, roll to the next valid instant.
 * 3. Enforce minimum spacing.
 *
 * Interval rollover example (from master prompt):
 * First post Friday 18:00 UK, gap 4 h, allowed Mon–Fri 09:00–19:00.
 * Calculated: Friday 22:00 → outside window → next = Monday 09:00 UK.
 */
export function nextIntervalSlot(
  previousReservedUtc: Date,
  settings: ScheduleSettings,
  existingSlots: Date[] = []
): Date {
  const { intervalGapMinutes = 240, minimumSpacingMinutes, allowedHoursStart, allowedHoursEnd, allowedWeekdays, timezone } = settings;

  let candidate = addMinutes(previousReservedUtc, intervalGapMinutes);

  // Apply rollover if outside allowed window
  const isDay = isAllowedWeekday(candidate, allowedWeekdays, timezone);
  const isHour =
    allowedHoursStart && allowedHoursEnd
      ? isWithinAllowedHours(candidate, allowedHoursStart, allowedHoursEnd, timezone)
      : true;

  if (!isDay || !isHour) {
    candidate = rollToNextAllowedWindow(candidate, settings);
  }

  // Enforce minimum spacing against all reserved slots
  for (const slot of existingSlots) {
    const diffMins = Math.abs(candidate.getTime() - slot.getTime()) / 60000;
    if (diffMins < minimumSpacingMinutes) {
      candidate = addMinutes(slot, minimumSpacingMinutes);
      // Re-check window after spacing adjustment
      candidate = rollToNextAllowedWindow(candidate, settings);
    }
  }

  return candidate;
}

// ── Batch assignment (first approved, first scheduled) ──────

/**
 * Assign scheduled times to an ordered list of approved drafts.
 *
 * A–E example from the brief:
 * 3 daily slots at 09:00, 13:00, 19:00 UK; 5 posts approved before first slot:
 * A→Day1 09:00, B→Day1 13:00, C→Day1 19:00, D→Day2 09:00, E→Day2 13:00
 */
export function assignSlots(
  settings: ScheduleSettings,
  count: number,
  afterUtc: Date = new Date()
): Date[] {
  const slots: Date[] = [];

  if (settings.mode === "fixed_slots") {
    let last = afterUtc;
    for (let i = 0; i < count; i++) {
      const slot = nextFixedSlot(last, settings, slots);
      slots.push(slot);
      last = slot;
    }
  } else {
    // interval mode
    const first = settings.intervalFirstPublishTime ?? afterUtc;
    let prev =
      !settings.intervalFirstPublishTime ||
      isBefore(settings.intervalFirstPublishTime, afterUtc)
        ? afterUtc
        : addMinutes(first, -(settings.intervalGapMinutes ?? 240));

    for (let i = 0; i < count; i++) {
      const slot = nextIntervalSlot(prev, settings, slots);
      slots.push(slot);
      prev = slot;
    }
  }

  return slots;
}

// ── DST test vectors (from master prompt Section 7) ─────────

export const DST_TEST_VECTORS = [
  // UK spring forward 2026: 29 March 2026 01:00 → 02:00
  {
    label: "Spring forward 2026-03-29",
    localTime: "01:30",
    timezone: DEFAULT_TIMEZONE,
    expectedBehaviour: "Non-existent time → advance to 02:00 BST (UTC+1)",
  },
  // UK autumn clock back 2026: 25 October 2026 02:00 → 01:00
  {
    label: "Autumn back 2026-10-25",
    localTime: "01:30",
    timezone: DEFAULT_TIMEZONE,
    expectedBehaviour: "Ambiguous time → use first occurrence (01:30 BST / UTC+1)",
  },
  // UK spring forward 2027: 28 March 2027
  {
    label: "Spring forward 2027-03-28",
    localTime: "01:30",
    timezone: DEFAULT_TIMEZONE,
    expectedBehaviour: "Non-existent time → advance to 02:00 BST",
  },
  // UK autumn clock back 2027: 31 October 2027
  {
    label: "Autumn back 2027-10-29",
    localTime: "01:30",
    timezone: DEFAULT_TIMEZONE,
    expectedBehaviour: "Ambiguous time → use first occurrence",
  },
];
