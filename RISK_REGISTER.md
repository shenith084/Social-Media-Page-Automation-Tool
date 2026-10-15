# Free-Tier Risk Register - Pixzora Social Media Automation Tool
**Master Prompt Section 2.4**

This register details all external services utilized by Pixzora, their free-tier limits, failure modes, automated fallbacks, and upgrade triggers.

---

## Service Risk Table

| Service | Free-Tier Limit | Failure Mode | Automated Fallback | Upgrade Trigger |
|---|---|---|---|---|
| **Google Gemini Flash** (Text AI) | 15 RPM / 1M TPM / 1,500 RPD | HTTP 429 Too Many Requests | Fallback to secondary model `gemini-1.5-flash-8b` or local retry with exponential backoff | > 1,200 posts generated/day |
| **Cloudflare Workers AI** (Image AI - FLUX.1 schnell) | 10,000 neurons/day (~50-100 free images) | HTTP 429 or quota exhaustion | Automated fallback to SVG/CSS branded gradient background with typography overlay | > 80 new AI images generated/day |
| **Cloudflare R2** (Asset Object Storage) | 10 GB storage, 1M Class A operations/month, 10M Class B operations/month | HTTP 403 quota exceeded | Fallback to Cloudinary Free Tier (25 GB credits/month) or local cache | Storage > 8 GB or uploads > 800k/month |
| **Cloudinary** (Secondary Storage) | 25 monthly transformation/storage credits | Upload rejection | Direct proxy / R2 primary storage | Exceeding 20 credits |
| **Vercel** (Next.js Web Hosting) | 100 GB bandwidth, 1,000 serverless execution hours | 402 Payment Required or paused deployment | Static CDN caching, Edge runtime optimization, migrate to Oracle Cloud VM | Bandwidth > 80 GB or team growth |
| **Neon PostgreSQL** (Database) | 0.5 GB storage, autoinactive compute after 5m | Connection latency on cold start (up to 3s) | Drizzle connection pooling with `@neondatabase/serverless` and HTTP adapter | Storage > 400 MB or active queries > limit |
| **n8n Automation Engine** | Self-hosted (Free open-source / fair-code) | Process crash or host out-of-memory | Docker restart policy `unless-stopped` + Healthchecks.io dead-man ping alert | Queue size > 50 simultaneous workflows |
| **Healthchecks.io** (Heartbeat Monitor) | 20 free checks | Check triggers down notification | Local audit log warning; dispatcher continues processing without ping | > 15 automated microservices |
| **Facebook Graph API** (Meta Developer Platform) | 200 calls/hour per user; Page rate limits based on audience size | HTTP 400 / 190 (Token expired) or 368 (Temporarily blocked) | State transitions to `needs_review`, queue pauses, email/in-app alert dispatched | Enterprise volume > 200 posts/hour |

---

## Safeguards Implemented in Code
1. **Zero Unauthenticated Leaks**: Admin middleware protects all dashboard routes with session authentication.
2. **Atomic Worker Locking**: `FOR UPDATE SKIP LOCKED` guarantees two background workers never publish or double-claim the same post.
3. **Graceful Degrade**: If image AI quota is exhausted, posts still generate with elegant typographic templates without failing the batch.