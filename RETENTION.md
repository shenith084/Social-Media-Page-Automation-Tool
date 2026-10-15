# Data Retention Policy
**Pixzora Social Media Automation Tool — Pixzora Labs**
**Effective date:** October 2026

---

## Retention Periods

| Data Type | Retention Period | Action at Expiry |
|---|---|---|
| Audit logs (`audit_logs`) | 24 months | Archived to cold storage or deleted |
| Publishing attempts (`publishing_attempts`) | 12 months | Deleted automatically by cleanup job |
| Generation requests and items | 6 months after completion | Soft-deleted (status = archived) |
| Original image assets | 6 months after draft is archived | Deleted from object storage, DB record removed |
| Final image assets | 12 months after post is published | Deleted from object storage, DB record removed |
| Draft content and content versions | Until manually archived by admin | Never hard-deleted while referenced by queue |
| Published posts record | Permanent (read-only audit trail) | Never deleted |
| Facebook access tokens | Until Page is disconnected | Deleted immediately on disconnection |
| User sessions | Until expiry (7 days) or sign-out | Purged on expiry |
| Usage records | 12 months | Deleted automatically |
| System heartbeats | 30 days (rolling) | Overwritten on each tick |
| Database backups | 30 days (3 rolling copies) | Oldest deleted when new backup taken |

---

## Implementation

- Automated cleanup job: run monthly via n8n scheduled workflow or a cron in the database.
- Backup encryption: all backups encrypted with AES-256-GCM before upload to R2/B2.
- Restore test: a backup restore test must be performed and documented before launch and quarterly thereafter.

---

## Exceptions

- Audit records that are subject to an active dispute or legal hold are excluded from automated deletion.
- Administrators may extend retention for specific records by flagging them in the audit log.
