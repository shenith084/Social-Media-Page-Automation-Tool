/**
 * Telemetry & Error Logging Utility
 * Supports Sentry integration when SENTRY_DSN is provided,
 * with structured console and fallback audit logging.
 */

export interface ErrorContext {
  module?: string;
  action?: string;
  userId?: string;
  queueItemId?: string;
  metadata?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorContext) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logPayload = {
    timestamp: new Date().toISOString(),
    level: "error",
    message: errorMessage,
    stack: errorStack,
    ...context,
  };

  // Structured logging
  console.error("[Pixzora Error]", JSON.stringify(logPayload, null, 2));

  // If SENTRY_DSN is configured, send to Sentry HTTP Store endpoint
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn && typeof fetch !== "undefined") {
    try {
      // Non-blocking report to Sentry
      const dsnUrl = new URL(sentryDsn);
      const projectId = dsnUrl.pathname.replace(/^\//, "");
      const sentryApiUrl = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/store/`;

      fetch(sentryApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=pixzora/1.0, sentry_key=${dsnUrl.username}`,
        },
        body: JSON.stringify({
          event_id: crypto.randomUUID().replace(/-/g, ""),
          timestamp: new Date().toISOString().replace("Z", ""),
          platform: "javascript",
          level: "error",
          message: { formatted: errorMessage },
          extra: context,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {
        // Silent catch for telemetry
      });
    } catch {
      // Ignore Sentry forwarding failures
    }
  }
}

export function captureMessage(message: string, context?: ErrorContext) {
  console.log(`[Pixzora Info] ${message}`, context ? JSON.stringify(context) : "");
}