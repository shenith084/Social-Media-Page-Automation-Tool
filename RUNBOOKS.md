# Runbooks — Pixzora Social Media Automation Tool
**Operational Procedures — Master Prompt Section 17**

---

## Runbook 1: Reconnect a Facebook Page

**When to use:** The Page connection status shows `token_expired` or `error`.

**Steps:**
1. Sign in as Administrator.
2. Go to **Settings** (`/settings`).
3. Under "Facebook Page Connection", click **Reconnect Page**.
4. Complete the Facebook OAuth flow — grant the required Page permissions (`pages_manage_posts`, `pages_read_engagement`, `pages_show_list`).
5. The system stores the new access token encrypted (AES-256-GCM) and runs a health check.
6. Confirm status changes to `connected` and the green health banner appears.
7. If the queue was paused due to token expiry, click **Resume Queue**.
8. Verify: go to Dashboard and confirm the next scheduled post shows the correct upcoming time.

**Notes:**
- Never paste the access token manually — always use the OAuth flow.
- If the token expires within 60 days, an alert appears in the Dashboard. Reconnect proactively.

---

## Runbook 2: Resolve a "Needs Review" Publishing Job

**When to use:** A queue item shows status `needs_review` in the Recovery screen.

**Steps:**
1. Go to **Recovery** (`/recovery`).
2. Click the affected job to expand its attempt history.
3. Check the error message and the `sent_marker_at` timestamp.
   - If `sent_marker_at` is set, the request **was sent** before the failure. The post may already be published.
4. **Check Facebook manually:** go to your Facebook Page and look for the post within a 10-minute window of the scheduled time.
5. If the post **was published:**
   - Copy the Facebook Post ID from the URL (e.g., `1373771052477282_12345678`).
   - In Recovery, click **Confirm Published** and enter the Post ID.
   - The system records it, marks the job `published` and adds it to history.
6. If the post **was NOT published:**
   - In Recovery, click **Safe Retry** — this runs reconciliation checks first.
   - The retry is refused if the outcome is still uncertain.
7. If the post is permanently unresolvable, click **Skip** to cancel the job and move the queue forward.

**Never click Retry without first checking Facebook manually when `sent_marker_at` is set.**

---

## Runbook 3: Rebuild the Publishing Schedule

**When to use:** Schedule settings were changed (timezone, slots, interval) or jobs have drifted from expected times.

**Steps:**
1. Go to **Settings** (`/settings`).
2. Under "Publishing Schedule", review the current settings.
3. Click **Preview Rebuild** — the system shows a before/after diff of all upcoming queue times.
4. Review the diff carefully. Jobs that are `publishing` or `published` are NOT changed.
5. Click **Confirm Rebuild** to apply.
6. Go to **Queue** (`/queue`) and verify the new scheduled times are correct.
7. Go to **Calendar** (`/calendar`) and confirm the calendar view reflects the updated schedule.

**Notes:**
- A rebuild only affects `queued` jobs. In-progress and published jobs are never touched.
- Rebuilding does NOT cancel approved posts — only their scheduled times change.

---

## Runbook 4: Restore from Backup

**When to use:** Database corruption, accidental deletion, or disaster recovery.

**Prerequisites:** Access to the backup storage (Cloudflare R2 or Backblaze B2). The encryption key used at backup time.

**Steps:**
1. Locate the most recent nightly backup file in R2/B2 (naming: `pixzora-backup-YYYY-MM-DD.sql.gz.enc`).
2. Download the backup file to a secure local machine.
3. Decrypt the backup:
   ```
   openssl enc -aes-256-gcm -d -in pixzora-backup.sql.gz.enc -out pixzora-backup.sql.gz -k YOUR_ENCRYPTION_KEY
   ```
4. Decompress:
   ```
   gunzip pixzora-backup.sql.gz
   ```
5. Restore to PostgreSQL:
   ```
   psql $DATABASE_URL < pixzora-backup.sql
   ```
6. Run Drizzle migrations to apply any schema changes since the backup:
   ```
   npx drizzle-kit push
   ```
7. Restart the Next.js application.
8. Verify: log in, check the Dashboard, and confirm the Queue and History show the correct data.
9. Record the restoration in the audit log manually (Settings → Audit trail).

**Notes:**
- Always test restore quarterly on a separate staging database before it is needed in production.
- Asset files (images) must be separately restored from the R2/B2 asset bucket.

---

## Runbook 5: Scheduler Stalled Alert

**When to use:** The Dashboard shows "Scheduler stalled" or the Healthchecks.io dead-man switch fires an alert.

**Diagnosis steps:**
1. Check if the Next.js app is running: open `https://your-domain.com/api/health` — should return `{"status":"ok"}`.
2. If the app is down: redeploy via Vercel dashboard or restart your Docker container.
3. If the app is up: check n8n is running and the timer dispatch workflow is active.
   - Open n8n at `http://your-n8n-host:5678`.
   - Check the `pxz-publish-dispatch` workflow — confirm it is **Active**.
   - Check recent executions — look for errors.
4. If n8n is failing to call the dispatch endpoint, check:
   - `INTERNAL_WEBHOOK_SECRET` is set correctly in both n8n and the Next.js environment.
   - The dispatch URL in n8n points to the correct `APP_URL`.
5. After fixing: manually trigger the dispatch workflow once in n8n to clear any backlog.
6. Verify: the Dashboard scheduler heartbeat updates and the stalled alert clears within 2 minutes.

**Notes:**
- The scheduler stalled alert fires when no heartbeat ping is received within 3 minutes (Healthchecks.io grace period).
- After downtime, missed jobs are moved to future slots — **no catch-up burst will occur**.
