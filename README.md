# Pixzora Social Media Automation Tool

> Production-grade, zero-cost, free-tier social media automation system built for automated Facebook post generation, review, scheduling (Europe/London), and publishing.

Built strictly according to **Project Requirements v1.0** and **Master Prompt v1.1**.

---

## ?? System Architecture & Core Features

- **Responsive Web Admin Panel (12 Screens):**
  - **Dashboard (`/dashboard`):** Real-time queue metrics, activity feed, one-click manual publishing dispatch.
  - **Generate Content (`/generate`):** Multi-post AI generation (headline, caption, hashtags) with prompt injection protection.
  - **Draft Library (`/drafts`):** Filterable, searchable draft cards with instant preview.
  - **Post Review & Editor (`/drafts/[id]`):** Live inline headline, caption, and hashtag editor with real-time visual re-rendering.
  - **Publishing Queue (`/queue`):** First-in-first-scheduled queue with reordering, pause/resume, and removal.
  - **Calendar View (`/calendar`):** Grouped chronological slots in UK-local time (BST/GMT aware).
  - **Published History (`/history`):** Complete immutable feed of published posts with external Facebook links.
  - **Recovery Center (`/recovery`):** Dead-letter queue with reconciliation checks for `needs_review`, `blocked`, and `retry_pending` jobs.
  - **Settings (`/settings`):** Facebook Page connection status, Workflow 1 test post proof, and schedule configuration.
  - **Templates (`/templates`):** Brand styling, typography, and AI provider selection.
  - **Users & Permissions (`/users`):** RBAC table with explicit `queue.approve` grant status.
  - **Usage & Audit (`/usage`):** Free-tier quota usage and append-only audit trail.

- **AI Text & Image Engine:**
  - **Google Gemini API (`gemini-3.5-flash` with fallback):** Structured JSON post copy generation in British English.
  - **Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`):** Free daily photo generation.
  - **Dynamic Visual Overlay (`/api/v1/internal/render-image`):** 1080x1080 Satori/Sharp rendering of exact headline and branding template.

- **Scheduling & Dispatch Engine:**
  - **Europe/London Timezone Authority:** UTC timestamp storage with BST/GMT daylight saving awareness.
  - **Strict FIFO Queue Integrity:** Prevents out-of-order publication.
  - **Atomic Worker Claims:** Row-level locking via PostgreSQL `FOR UPDATE SKIP LOCKED`.

---

## ?? Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon Serverless Postgres)
- Facebook Developer App with Page Access Token (Page: `Viral reels`, ID: `1373771052477282`)
- Google Gemini API Key (free tier)

### Installation

```bash
# Clone and enter the repository
cd pixzora-social-automation

# Install dependencies
npm install

# Run database migrations
npx drizzle-kit push
```

### Running Locally

```bash
# Start development server
npm run dev

# Run automated acceptance test suite (DST vectors, A-E batch allocation, state machine)
npm test

# Build production bundle
npm run build
```

The admin panel will be accessible at [http://localhost:3000](http://localhost:3000).

---

## ??? Environment Variables Reference

See `.env.example` for the complete configuration:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (supports Neon / self-hosted) |
| `FB_APP_ID` | Facebook Developer App ID |
| `FB_APP_SECRET` | Facebook Developer App Secret |
| `FB_PAGE_ID` | Target Facebook Page ID (`1373771052477282`) |
| `FB_ACCESS_TOKEN` | Permanent Page Access Token |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `TEXT_AI_MODEL` | Text model (`gemini-3.5-flash` default) |
| `CF_ACCOUNT_ID` | Cloudflare Account ID |
| `CF_WORKERS_AI_TOKEN`| Cloudflare Workers AI Token |
| `INTERNAL_API_SECRET` | HMAC shared secret for dispatch callbacks |

---

## ?? Automated Acceptance Tests

The project includes unit & acceptance test suites verifying core requirements from the specification:

```bash
npm test
```

Verified Test Scenarios:
1. **Section 1.6 A to E Batch Allocation:** Verifies 5 drafts assigned across 3 daily UK slots (09:00, 13:00, 19:00).
2. **Daylight Saving Time (DST) Transitions:** Verifies 29 March 2026 (Spring forward) and 25 October 2026 (Fall back) instant calculations.
3. **Interval Mode Weekend Rollover:** Verifies Friday night interval rollover to Monday morning 09:00 BST.
4. **Job State Machine Transitions:** Verifies legal vs illegal status transitions across all 8 states.

---

## ?? License

MIT License - Developed for Pixzora Labs.