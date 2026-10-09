import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string | null, timezone = "Europe/London"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDate(date: Date | string | null, timezone = "Europe/London"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    dateStyle: "medium",
  }).format(d);
}

export function getTimezoneLabel(timezone = "Europe/London"): string {
  const now = new Date();
  const offset = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    timeZoneName: "short",
  })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value;
  return offset ?? timezone;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
