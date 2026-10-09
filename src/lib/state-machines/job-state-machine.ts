// ============================================================
// JOB STATE MACHINE
// Social Media Page Automation Tool — Pixzora Labs
// Publishing job states and legal transitions
// ============================================================

export type JobStatus =
  | "queued"
  | "publishing"
  | "published"
  | "retry_pending"
  | "blocked"
  | "needs_review"
  | "skipped"
  | "cancelled";

export type GenerationStatus =
  | "requested"
  | "processing"
  | "partly_complete"
  | "ready"
  | "failed";

export type GenerationItemStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed";

// ── Job State Transitions ───────────────────────────────────

export interface JobTransition {
  from: JobStatus;
  to: JobStatus;
  trigger: string;
  actor: "system" | "admin" | "automation";
  guard?: string;
}

export const JOB_TRANSITIONS: JobTransition[] = [
  // Normal publishing flow
  {
    from: "queued",
    to: "publishing",
    trigger: "Worker claims job",
    actor: "automation",
    guard: "Approved content, asset exists, page connected, no ordering block",
  },
  {
    from: "publishing",
    to: "published",
    trigger: "Facebook API confirms success",
    actor: "automation",
    guard: "Remote post ID returned, no existing attempt-started marker conflict",
  },
  // Retry flow
  {
    from: "publishing",
    to: "retry_pending",
    trigger: "Confirmed transient failure",
    actor: "automation",
    guard: "Retry count < max_retries; NOT timeout (timeout → needs_review)",
  },
  {
    from: "retry_pending",
    to: "publishing",
    trigger: "Retry delay elapsed",
    actor: "automation",
    guard: "No earlier uncertain attempt",
  },
  // Blocked
  {
    from: "publishing",
    to: "blocked",
    trigger: "Content or permission failure",
    actor: "automation",
    guard: "Non-transient API error (invalid content, permission denied)",
  },
  {
    from: "retry_pending",
    to: "blocked",
    trigger: "Max retries exceeded",
    actor: "automation",
  },
  // Uncertain outcome (timeout)
  {
    from: "publishing",
    to: "needs_review",
    trigger: "Timeout after sending (attempt-started marker exists)",
    actor: "automation",
    guard: "sent_marker_at is set but no confirmed outcome",
  },
  {
    from: "publishing",
    to: "needs_review",
    trigger: "Worker lease expired with sent marker",
    actor: "automation",
    guard: "sent_marker_at is set, lease expired, no confirmed outcome",
  },
  // Admin recovery actions
  {
    from: "needs_review",
    to: "publishing",
    trigger: "Admin: safe retry (after reconciliation confirms not published)",
    actor: "admin",
    guard: "Reconciliation complete, platform records confirm not published",
  },
  {
    from: "needs_review",
    to: "published",
    trigger: "Admin: confirm published with platform ID",
    actor: "admin",
    guard: "Admin enters valid platform post ID",
  },
  {
    from: "needs_review",
    to: "skipped",
    trigger: "Admin: skip",
    actor: "admin",
  },
  {
    from: "needs_review",
    to: "cancelled",
    trigger: "Admin: cancel",
    actor: "admin",
  },
  {
    from: "blocked",
    to: "publishing",
    trigger: "Admin: safe retry after resolving block",
    actor: "admin",
  },
  {
    from: "blocked",
    to: "skipped",
    trigger: "Admin: skip",
    actor: "admin",
  },
  {
    from: "blocked",
    to: "cancelled",
    trigger: "Admin: cancel",
    actor: "admin",
  },
  // Queue management
  {
    from: "queued",
    to: "cancelled",
    trigger: "Admin: remove from queue",
    actor: "admin",
    guard: "Draft is preserved; no Facebook post deletion",
  },
  {
    from: "queued",
    to: "skipped",
    trigger: "Admin: skip (unblock downstream)",
    actor: "admin",
  },
];

// ── Legal transition lookup ─────────────────────────────────

export function isLegalTransition(from: JobStatus, to: JobStatus): boolean {
  return JOB_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function getTransition(
  from: JobStatus,
  to: JobStatus
): JobTransition | undefined {
  return JOB_TRANSITIONS.find((t) => t.from === from && t.to === to);
}

// ── Terminal states ─────────────────────────────────────────

export const TERMINAL_STATES: JobStatus[] = [
  "published",
  "skipped",
  "cancelled",
];

export function isTerminalState(status: JobStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

// ── Active states (shown as blocking or in-progress) ────────

export const ACTIVE_STATES: JobStatus[] = [
  "queued",
  "publishing",
  "retry_pending",
  "needs_review",
  "blocked",
];

// ── Generation state transitions ────────────────────────────

export interface GenerationTransition {
  from: GenerationStatus;
  to: GenerationStatus;
  trigger: string;
}

export const GENERATION_TRANSITIONS: GenerationTransition[] = [
  {
    from: "requested",
    to: "processing",
    trigger: "n8n workflow started",
  },
  {
    from: "processing",
    to: "partly_complete",
    trigger: "Some items complete, some still pending",
  },
  {
    from: "processing",
    to: "ready",
    trigger: "All items complete",
  },
  {
    from: "partly_complete",
    to: "ready",
    trigger: "Remaining items complete",
  },
  {
    from: "processing",
    to: "failed",
    trigger: "All items failed",
  },
  {
    from: "partly_complete",
    to: "failed",
    trigger: "Remaining items failed, none succeed",
  },
  {
    from: "failed",
    to: "processing",
    trigger: "Admin: retry failed items",
  },
];
