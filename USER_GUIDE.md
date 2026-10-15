# User Guide - Pixzora Social Media Automation Tool
**Operational Guide for Administrators and Content Editors**

---

## 1. System Overview
Pixzora is an automated social media management system designed to generate, review, schedule, and publish posts to Facebook Pages on autopilot while keeping human oversight at the center.

### User Roles
- **Administrator**: Full system access (Facebook Page connection, schedule configuration, AI parameters, user management, dead-letter recovery).
- **Content Editor**: Content generation, headline and caption editing, visual template selection. Requires explicit `queue.approve` permission to approve posts directly into the publishing queue.

---

## 2. Navigating the Admin Console

### 1. Dashboard (`/dashboard`)
- View queue health at a glance (queued, published, and pending review counts).
- Monitor live system activity log.
- Trigger manual dispatch test using the **Trigger Dispatch** action.

### 2. Generate Content (`/generate`)
- Select target **Topic** and provide detailed instructions.
- Choose post count (1 to 10 drafts per batch).
- Set tone (Professional, Engaging, Humorous, Educational) and Target Audience.
- Click **Generate Drafts** - n8n will orchestrate Gemini for copywriting and Cloudflare Workers AI FLUX.1 schnell for background imagery.

### 3. Draft Library & Editor (`/drafts` & `/drafts/[id]`)
- Browse all draft versions with status badges (`ready`, `processing`, `failed`).
- Click any draft to open the interactive **Draft Editor**:
  - Live preview of the 1080x1080 rendered post visual.
  - Modify headline, caption, subheading, and hashtags.
  - One-click **Approve & Queue** to allocate the next optimal time slot in Europe/London timezone.

### 4. Publishing Queue (`/queue`)
- Inspect scheduled posts arranged chronologically.
- Remove unwanted posts with row-level trash actions.
- Use the **Pause Queue** / **Resume Queue** toggle to halt or resume publishing instantly.

### 5. Calendar View (`/calendar`)
- Visual day-by-day and slot-by-slot view of upcoming scheduled posts.
- Shows exact scheduled local times in UK timezone (`Europe/London`).

### 6. Published History (`/history`)
- Immutable audit log of successfully published Facebook posts.
- Click external post links to view live posts on Facebook.

### 7. Recovery Screen (`/recovery`)
- Real-time view of failed or flagged jobs (`needs_review`, `blocked`, `retry_pending`).
- Inspect error messages and Facebook Graph API diagnostic codes.
- Safely retry or dismiss stuck jobs without risk of double-posting.

### 8. Settings & Page Connection (`/settings`)
- Check status of connected Facebook Page (ID: `1373771052477282` - Viral reels).
- View Page token validity and run live connection checks.
- Configure daily slots (default: `09:00`, `13:00`, `19:00` UK time) and minimum post spacing.

### 9. Templates & AI Settings (`/templates`)
- Configure brand fonts, colors, and visual styles.
- Switch AI providers and inspect usage thresholds.

### 10. Users & Permissions (`/users`)
- View registered users and assign roles.
- Grant or revoke explicit `queue.approve` overrides for Content Editors.

### 11. Usage & Audit Logs (`/usage`)
- View provider API call volume (Gemini, Workers AI, R2/Cloudinary).
- Audit trail recording who created, edited, approved, or cancelled each post.

---

## 3. Best Practices
1. **Never edit published posts in the queue**: Once a post is published, it moves to History permanently.
2. **Review images before approving**: Always ensure the headline overlay is legible against the background image.
3. **Monitor the Recovery tab**: If Facebook rejects a post (e.g., token expired or permission error), the job enters `needs_review` and halts further queue publishing for safety until acknowledged.