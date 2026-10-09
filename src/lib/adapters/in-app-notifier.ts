import { Notifier, NotificationPayload } from "./types";

export class InAppNotifier implements Notifier {
  async send(payload: NotificationPayload): Promise<void> {
    const emojis: Record<string, string> = {
      info: "ℹ️",
      warning: "⚠️",
      critical: "🚨",
      in_app: "🔔",
      telegram: "✈️",
      email: "📧"
    };

    const emoji = emojis[payload.channel] || "🔔";

    // Log to standard output for Docker logs
    console.log(`[Alert] ${emoji} ${payload.title}: ${payload.body}`);

    // TODO: Insert into PostgreSQL notifications table so it appears in the Web Admin Panel UI
    // await db.insert(notifications).values({ message: payload.body, severity: payload.channel, createdAt: new Date() });
  }
}
