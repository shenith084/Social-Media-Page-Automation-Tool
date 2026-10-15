# RBAC Matrix — Pixzora Social Media Automation Tool
**Role x Permission Table — Master Prompt Section 9**

---

## Roles

| Role | Description |
|---|---|
| **Administrator** | Full access to all modules including settings, user management and recovery |
| **Content Editor** | Can generate and edit drafts. Queue approval only when explicitly granted |
| **Automation Service** | Restricted service credentials for internal endpoints only |

---

## Permission Matrix

| Permission | Administrator | Content Editor | Automation Service |
|---|---|---|---|
| **Page & Connection** | | | |
| `page.connect` | YES | NO | NO |
| `page.view` | YES | YES | NO |
| **Schedule** | | | |
| `schedule.edit` | YES | NO | NO |
| `schedule.rebuild` | YES | NO | NO |
| **AI & Templates** | | | |
| `aiSettings.edit` | YES | NO | NO |
| `template.edit` | YES | NO | NO |
| **Generation** | | | |
| `generation.run` | YES | YES | NO |
| `draft.create` | YES | YES | NO |
| `draft.edit` | YES | YES | NO |
| `draft.regenerate` | YES | YES | NO |
| `draft.archive` | YES | YES | NO |
| **Queue & Publishing** | | | |
| `queue.approve` | YES | GRANT ONLY | NO |
| `queue.reorder` | YES | NO | NO |
| `queue.remove` | YES | NO | NO |
| `queue.pause` | YES | NO | NO |
| `queue.resume` | YES | NO | NO |
| `queue.replace` | YES | NO | NO |
| **Recovery** | | | |
| `job.retry` | YES | NO | NO |
| `job.confirmPublished` | YES | NO | NO |
| `job.skip` | YES | NO | NO |
| `job.cancel` | YES | NO | NO |
| **Admin** | | | |
| `user.manage` | YES | NO | NO |
| `audit.view` | YES | NO | NO |
| `usage.view` | YES | YES | NO |
| **Internal (service only)** | | | |
| `internal.dispatch` | NO | NO | YES |
| `internal.callback` | NO | NO | YES |

---

## Notes

- `queue.approve` for Content Editors is a **per-user explicit grant** stored in `user_permission_grants`. It is NOT part of the Content Editor role by default.
- The Automation Service role is a system account. It authenticates via `INTERNAL_WEBHOOK_SECRET` (HMAC-SHA256), not a user session.
- All permissions are enforced server-side (middleware + API layer). UI hiding is a convenience only.
- Additional roles can be added by inserting rows in the `roles` table and assigning permissions in `role_permissions`.
