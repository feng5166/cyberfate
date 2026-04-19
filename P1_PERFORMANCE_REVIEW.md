# P1-1 Performance & Load Review — CyberFate

_Reviewer: explorer agent · Date: 2026-04-19 · Branch: `main` @ b100916_

## Executive summary

**Grade: C (Functional, but not production-hardened for load)**

The codebase has correct fundamentals (Redis caching on AI calls, atomic quota for bazi, postgres transactions on webhook), but it will buckle under realistic traffic for three reasons: (1) the Vercel serverless deployment is mis-configured for long-running AI calls, (2) the Postgres schema has effectively no secondary indexes, and (3) the rendered client bundle is enormous because nothing is code-split.

**Top 3 risks (user-visible impact):**

1. **AI routes will 504 in production under concurrency.** `vercel.json` only extends `maxDuration` for `/api/payment/**`. Every AI route (bazi/daily/tarot/meihua/liuyao/huangli-ask/ziwei) falls back to Vercel's Hobby 10s / Pro 15s default. The client `fetch` to DeepSeek is configured with a 30s timeout for bazi (`src/lib/ai/client.ts:26`), so Vercel will kill the function before DeepSeek can respond on cold cache. Users see 504s and the fallback branch never runs.
2. **Postgres will slow to a crawl past a few thousand users.** `prisma/schema.prisma` has only ONE `@@index` in the entire file (line 193, on `password_reset_tokens.email`). Hot queries on `subscriptions(userId, status, expireAt)`, `orders(userId, status, createdAt)`, `usage_quotas(userId, date)` unique-only, and `tarot_readings(userId, createdAt)` all rely on full scans or the PK.
3. **First-paint is slow and client JS is oversized.** 81 `'use client'` files, zero `next/dynamic` / `React.lazy` usage, a 1,300-line `/liuyao/page.tsx` and 1,119-line `/bazi/page.tsx` all bundled eagerly. `html2canvas` (~200KB) is declared in `package.json` but **not imported anywhere** in `src/`, so it still ships if anything accidentally pulls it in, and at minimum inflates `node_modules`/install time.

---

## 1.1 Frontend performance

### F-1 · 81 client components with zero code-splitting — P1-High
- **Where:** 81 `'use client'` files total; biggest offenders:
  - `src/app/liuyao/page.tsx` (1,300 lines, `'use client'`)
  - `src/app/bazi/page.tsx` (1,119 lines, `'use client'`)
  - `src/app/tarot/page.tsx` (821 lines, `'use client'`)
  - `src/app/meihua/page.tsx` (517 lines, `'use client'`)
  - `src/app/ziwei/page.tsx` (539 lines, `'use client'`)
- **Confirmation:** `grep -r "next/dynamic\|React.lazy"` on `src/` returns **zero matches**.
- **Impact:** Every landing on `/bazi` or `/liuyao` downloads the entire page module (form + results + chart + share card + dictionary) before Hydrate. LCP and TBT on mobile 4G will be poor.
- **Fix:**
  - Split "results-only" UI (`BaziChart`, `WuxingChart`, `FiveDimensionChart`, `ShareCard`, `PalaceGrid`, `DualChartCompare`, `StarDictionary`) behind `next/dynamic(() => import('...'), { ssr: false, loading: ... })`. They only render after the form submit — no reason to ship them in the initial bundle.
  - Convert page-level shells (`/bazi/page.tsx`, `/liuyao/page.tsx`) into Server Components that render a small `<BaziForm />` client island; move the results pane into a dynamically-imported client component.
  - Target: cut initial JS on `/bazi` by ≥ 40%.

### F-2 · `html2canvas` is a dead dependency — P1-Medium
- **Where:** `package.json:24` declares `"html2canvas": "^1.4.1"`.
- **Confirmation:** `grep -r "html2canvas"` on `src/` returns **zero matches**. `ShareCard.tsx` uses only `qrcode` (line 5). `ChartShareButton.tsx` likewise does not import it.
- **Impact:** ~200KB gzipped hangs around in `node_modules`, slows `npm ci` on every Vercel deploy, and any stray import re-introduces it to the bundle. `@types/dompurify` and `@types/bcryptjs` are also in `dependencies` when they belong in `devDependencies`, which again bloats the production install tree.
- **Fix:** `npm uninstall html2canvas` and move `@types/*` packages to `devDependencies`. If a future share-as-image feature is needed, prefer `satori` (server-side, no client JS).

### F-3 · Raw `<img>` instead of `next/image` — P1-Medium
- **Where:** `next/image` only used in 5 files (`PaymentModal`, `Sidebar`, `Header`, `Footer`, `reset-password`). Tarot cards (`src/app/tarot/page.tsx`) and avatars in `CardDrawAnimation.tsx` render via raw `<img>`.
- **Impact:** No automatic WebP/AVIF serving, no lazy-loading, no responsive `srcset`. Tarot especially renders up to 10 cards (celtic spread) at full resolution.
- **Fix:** Migrate tarot card rendering to `next/image` with `sizes` hints; configure `images.remotePatterns` in `next.config.ts` for any CDN origin. Add `loading="lazy"` as a temporary mitigation if migration is large.

### F-4 · No bundle analyzer / performance budget — P1-Low
- **Where:** `package.json`, `next.config.ts`.
- **Impact:** No visibility into which chunks are growing. Regressions go unnoticed.
- **Fix:** Add `@next/bundle-analyzer` behind `ANALYZE=true` and a CI gate (e.g. fail if any chunk > 250KB gzipped).

---

## 1.2 Backend API performance

### B-1 · AI routes have no `maxDuration` override — P1-Critical
- **Where:** `vercel.json:1` only overrides `src/app/api/payment/**/*.ts` to `maxDuration: 30`.
- **Confirmation:** The AI clients use long client-side timeouts: `src/lib/ai/client.ts:26-32` sets `bazi: 30000`, `marriage: 30000`, `daily/tarot: 15000`. Everything else (`/api/bazi`, `/api/daily`, `/api/tarot/draw`, `/api/meihua/decide`, `/api/huangli/ask`, `/api/liuyao`, `/api/ziwei`) inherits Vercel's default **10s (Hobby) / 15s (Pro)**.
- **Impact:** First-time cache-miss bazi analysis (prompt `max_tokens: 2000` at `client.ts:112`) routinely takes 15–25s from DeepSeek. On a Hobby plan the function is killed at 10s and returns a generic 504 — the carefully-written `generateFallbackBaziAnalysis` never runs because the timeout is at the platform layer, not at `fetch`. The user sees a raw Vercel timeout page.
- **Fix:** Extend `vercel.json`:
  ```json
  "functions": {
    "src/app/api/payment/**/*.ts": { "maxDuration": 30 },
    "src/app/api/bazi/**/*.ts":    { "maxDuration": 60 },
    "src/app/api/daily/**/*.ts":   { "maxDuration": 30 },
    "src/app/api/tarot/**/*.ts":   { "maxDuration": 30 },
    "src/app/api/meihua/**/*.ts":  { "maxDuration": 30 },
    "src/app/api/liuyao/**/*.ts":  { "maxDuration": 30 },
    "src/app/api/ziwei/**/*.ts":   { "maxDuration": 30 },
    "src/app/api/huangli/**/*.ts": { "maxDuration": 30 }
  }
  ```
  Also shorten `client.ts` timeouts to be **less than** server `maxDuration` minus a ~3s safety margin so `fetch` aborts cleanly and the fallback branch runs (currently bazi `client` timeout = platform default, inverted).

### B-2 · `/api/huangli/ask` has NO fetch timeout and NO fallback — P1-High
- **Where:** `src/app/api/huangli/ask/route.ts:52-64` calls DeepSeek via bare `fetch` with no `AbortController`, no `signal`, no try/catch retries.
- **Impact:** If DeepSeek hangs (network partition, API degradation), the request sits until Vercel kills the function at 10s and the user sees a timeout — not the polite `{ answer: '抱歉，AI 暂时无法回答...' }` fallback on line 78 which only fires on non-OK status.
- **Fix:** Wrap in the same `callDeepSeek` helper from `src/lib/ai/client.ts:39` (which has `AbortController` + feature-specific timeout). Add `'huangli_ask': 10000` to `TIMEOUT_CONFIG`. The fallback path already exists on line 78 — just make sure the abort path reaches it.

### B-3 · No pagination on `/api/subscription/invoices` and `/billing-history` — P1-High
- **Where:**
  - `src/app/api/subscription/invoices/route.ts:21` — `prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })` (no `take`).
  - `src/app/api/subscription/invoices/route.ts:42` — same for `subscription.findMany`.
  - `src/app/api/subscription/billing-history/route.ts:25` — same for `orders`.
- **Impact:** For a long-lived VIP user (daily renewals × 365 days = 365 orders), each invoice page load transfers and JSON-serialises the entire history. Latency grows O(n) per user.
- **Fix:** Add `take: 50` and cursor-based pagination (`cursor: { id: lastId }`). Return `nextCursor` in the response. Tarot history at `src/app/api/tarot/history/route.ts:15` already does this correctly (`take: 20`) — copy that pattern.

### B-4 · Bazi quota requires THREE DB round-trips — P1-Medium
- **Where:** `src/app/api/bazi/route.ts:52-61` (peek), `97-101` (deduct); `src/lib/quota.ts:60-87` (peek + deduct).
- **Impact:** On a logged-in bazi request you do: `peekBaziQuota` (subscription findFirst + usageQuota findUnique = 2 queries) → AI call → `peekBaziQuota` **again** (another 2 queries) → `deductBaziQuota` (1 upsert). That's 5 sequential DB calls around the AI call. Each hits Postgres over network latency.
- **Fix:** Cache `isVip(userId)` in a request-scoped memo or short-lived Redis key (30s TTL). Pass the VIP flag from the first `peekBaziQuota` into the deduct path instead of re-querying. Expected savings: ~60–150 ms per bazi request.

### B-5 · Tarot quota has a TOCTOU race and doesn't atomic-increment — P1-High
- **Where:** `src/app/api/tarot/draw/route.ts:57-94`. `checkQuota` reads `usageQuota`, returns "allowed", and `useQuota` (line 237-242) writes AFTER the AI call completes.
- **Impact:** A user can fire 10 concurrent requests, all pass `checkQuota` (all see `used=0`), all trigger the AI call, all increment the counter once. Result: `tarotSingleCount=10` instead of 3 — but the user already received 10 AI responses and burned 10× the DeepSeek budget. The bazi quota (`src/lib/quota.ts:33-44`) uses `updateMany` with `where: { baziAiCount: { lt: limit } }` atomically, which is correct — tarot should follow the same pattern.
- **Fix:** Atomically increment-and-check up-front:
  ```ts
  const updated = await prisma.usageQuota.updateMany({
    where: { userId, date: today, tarotSingleCount: { lt: limit } },
    data: { tarotSingleCount: { increment: 1 } },
  });
  if (updated.count === 0) return 429;
  ```
  Wrap with `upsert`-create-if-missing first. If the AI call later fails, decrement on error (or track "attempted vs succeeded" separately).

### B-6 · AI routes have no per-user rate limiting — P1-High
- **Where:** `src/lib/rate-limit.ts` is only wired into `password-reset`, `auth/register`, `auth/check-email`, `auth/reset-password`, `feedback`. **Zero** AI routes call it.
- **Impact:** A malicious/runaway client can hammer `/api/bazi` 100×/sec. Redis cache-miss rate spikes, DeepSeek bill balloons, Postgres quota table locks contend, legitimate users time out. The 1/day quota only kicks in for logged-in users — guest bazi is unlimited (`src/app/api/bazi/route.ts:52` treats no-session as "skip quota").
- **Fix:** Add `checkRateLimit('ai_bazi', ip, 10, 60)` (and per-user equivalent) at the top of every AI route handler. Set guest limits to 3/hour to stop scraping.

### B-7 · Webhook reads inside transactions serialise under load — P1-Low
- **Where:** `src/app/api/payment/webhook/route.ts:251-270` and `294-344`. Each webhook runs 1–2 `findFirst` reads inside `prisma.$transaction`.
- **Impact:** On Stripe bursts (batch webhook replay), transactions hold row locks longer than necessary. Throughput suffers.
- **Fix:** Where possible, move read-only queries outside the transaction and use `SELECT ... FOR UPDATE` equivalent via `upsert` semantics. Low priority because payment volume is the natural limiter.

---

## 1.3 Concurrency safety

### C-1 · `isVip` has no cache — N+1 pattern — P1-Medium
- **Where:** `src/lib/subscription.ts:5-14`. Called from `src/lib/quota.ts:24, 62`, `src/app/api/tarot/draw/route.ts:96-101, 153, 161, 238`, and others. `tarot/draw` alone calls `isVip` up to **3 times** in one request (lines 153, 161 via inner `if`, 238).
- **Impact:** Redundant Postgres queries, each ~10–30 ms. Under burst traffic (e.g. a VIP marketing email drop), the `subscription` table is a hot path.
- **Fix:** Add a request-level memo (e.g. `cache(fn)` from `react` in Next 14 server-only, or pass `isVip` boolean through). Longer-term, cache `isVip:<userId>` in Redis with a 60s TTL and invalidate on subscription writes.

### C-2 · Tarot quota race (duplicate of B-5) — P1-High
See B-5. Concurrent tarot draws can exceed daily limit. `bazi/route.ts` deliberately uses atomic `updateMany` (correct); tarot/draw does not.

### C-3 · Prisma client singleton is correct — GOOD
- **Where:** `src/lib/db.ts:1-12`.
- **Note:** Uses `globalThis` caching to avoid connection exhaustion across hot-reloads. Good. Production behavior is fine; worth noting because it's a common mistake to re-instantiate `new PrismaClient()` per request in serverless.

### C-4 · Redis proxy swallows errors silently — P1-Low
- **Where:** `src/lib/cache/redis.ts:52-68`. The Proxy wrapper catches every Redis error and returns `null` with a `console.error` log.
- **Impact:** Cache-write failures appear as a cache miss on the next request, so AI is re-invoked — could mask a persistent Redis outage as "slow AI" rather than "cache down". The rate-limiter (`rate-limit.ts:14-18`) correctly fails CLOSED, but this proxy fails OPEN.
- **Fix:** Emit a metric / Sentry breadcrumb with rate, not just console. Currently there is no structured logging at all.

---

## 1.4 Resource optimization

### R-1 · Schema has essentially no indexes — P1-Critical
- **Where:** `prisma/schema.prisma`. Only indexes present: primary keys, `@unique` constraints, and a single explicit `@@index([email])` at line 193 on `password_reset_tokens`.
- **Missing indexes the query patterns demand:**
  - `subscriptions(userId, status, expireAt)` — every `isVip()` call (`subscription.ts:7-13`) filters on these three fields.
  - `orders(userId, status, createdAt DESC)` — `billing-history/route.ts:25`, `invoices/route.ts:21`.
  - `subscriptions(userId, createdAt DESC)` — `invoices/route.ts:42`.
  - `tarot_readings(userId, createdAt DESC)` — `tarot/history/route.ts:12`.
  - `usage_quotas(userId, date)` already has `@@unique([userId, date])` at line 180, which doubles as an index — **OK**.
- **Impact:** At 10K users with typical fan-out, every `isVip` does a sequential scan on `subscriptions`. At 100K orders, `billing-history` takes seconds.
- **Fix:** Add to `schema.prisma`:
  ```prisma
  model Subscription {
    // ...
    @@index([userId, status, expireAt])
    @@index([userId, createdAt])
    @@map("subscriptions")
  }
  model Order {
    // ...
    @@index([userId, status, createdAt])
    @@map("orders")
  }
  model TarotReading {
    // ...
    @@index([userId, createdAt])
    @@map("tarot_readings")
  }
  ```
  Run `prisma migrate dev --name add_perf_indexes`. On an already-populated prod DB, create them `CONCURRENTLY` manually to avoid table locks.

### R-2 · Redis cache-key strategy is good — GOOD
- **Where:** `src/lib/ai/client.ts:84-89` (`v3:bazi:<hash>`), `:181` (`daily:<dayMaster>:<dayun>:<liunian>:<targetDate>`), tarot/draw `:190-194` (signature includes spread + card IDs + orientation + question). Daily has 24h TTL (line 221), tarot 12h (line 234). Bazi key has no TTL set (permanent), which is fine because birth data is immutable.
- **Minor:** bazi `cacheKey` uses only `birthDate + birthHour` — not `gender` (`client.ts:87` sets `gender: undefined`). Two users of opposite genders with the same birth get the same cached analysis. Whether this is desirable depends on prompt — check `buildBaziPrompt` to confirm gender isn't used in the AI output. If it is, add gender to the cache key.

### R-3 · No compression / caching headers on static responses — P1-Low
- **Where:** `next.config.ts` sets security headers only. No `Cache-Control` for static API responses.
- **Impact:** `/api/quota`, `/api/subscription/current` etc. re-hit the DB on every navigation.
- **Fix:** Where safe, set `Cache-Control: private, max-age=30` on user-scoped reads.

### R-4 · Lunar-javascript bundle cost on client — P1-Low
- **Where:** `package.json:26`. `lunar-javascript` is a ~300KB library. Used in `src/lib/bazi/*` (server-side) and possibly leaked to client via shared imports.
- **Fix:** Audit that no `'use client'` file imports from `@/lib/bazi` directly. If the client needs lunar date formatting, expose a thin API endpoint.

---

## Prioritized remediation plan

| # | ID | Title | Sev | Effort | File(s) | Expected win |
|---|----|-------|-----|--------|---------|--------------|
| 1 | B-1 | Add `maxDuration` overrides for all AI routes | P1-Critical | S (10 min) | `vercel.json` | Eliminates production 504s on bazi/daily |
| 2 | R-1 | Add `@@index` on subscriptions/orders/tarot_readings | P1-Critical | S (30 min + migration) | `prisma/schema.prisma` | 10–100× speedup on hot queries |
| 3 | B-5 / C-2 | Atomic tarot quota increment | P1-High | S | `src/app/api/tarot/draw/route.ts` | Closes billing/abuse loophole |
| 4 | B-2 | Add `AbortController` to huangli/ask | P1-High | S | `src/app/api/huangli/ask/route.ts` | Eliminates silent 504s |
| 5 | B-3 | Paginate `/invoices` and `/billing-history` | P1-High | S | `src/app/api/subscription/invoices/route.ts`, `billing-history/route.ts` | Bounds API latency per user |
| 6 | B-6 | Rate-limit AI routes (IP + userId) | P1-High | M | 7 route files | Protects DeepSeek budget |
| 7 | F-1 | `next/dynamic` for results panels & chart components | P1-High | M (1 day) | 5 page files + ~10 components | ~40% smaller initial JS on /bazi |
| 8 | F-2 | Remove `html2canvas` + move `@types/*` to devDeps | P1-Medium | XS | `package.json` | Faster installs, ~200KB off potential bundles |
| 9 | C-1 | Memoize `isVip()` per request | P1-Medium | S | `src/lib/subscription.ts` + callers | Cuts 2–5 DB queries per AI request |
| 10 | F-3 | Migrate tarot card `<img>` → `next/image` | P1-Medium | M | `src/app/tarot/page.tsx`, `CardDrawAnimation.tsx` | Faster LCP on /tarot |
| 11 | B-4 | Reduce bazi quota round-trips | P1-Medium | S | `src/lib/quota.ts`, `src/app/api/bazi/route.ts` | ~100 ms off bazi latency |
| 12 | F-4 | Add bundle-analyzer + CI budget | P1-Low | S | `next.config.ts`, CI | Prevents future regressions |
| 13 | R-3 | Cache-Control on read-only user APIs | P1-Low | S | Multiple | Reduces DB load |
| 14 | B-7 | Move webhook reads outside transactions | P1-Low | M | `src/app/api/payment/webhook/route.ts` | Higher webhook throughput |

**Effort legend:** XS = < 15 min, S = < 1 h, M = 1 day, L = multi-day.

---

## What's already good

- **Atomic bazi quota** via `updateMany … { lt: limit }` in `src/lib/quota.ts:40-44` — textbook correct.
- **Redis fail-closed rate-limiting** for auth routes (`src/lib/rate-limit.ts:14-18`).
- **Prisma singleton via `globalThis`** (`src/lib/db.ts`) — avoids serverless connection storms.
- **Webhook idempotency** via `transactionId` unique constraint (`prisma/schema.prisma:155`) + P2002 handling (`webhook/route.ts:274-278`).
- **AI fallback branches everywhere** — bazi/daily/tarot/meihua/liuyao all have structured fallbacks if DeepSeek fails. Graceful degradation story is solid; only B-1 and B-2 block it from triggering.
- **Request-scoped `AbortController`** in the shared `callDeepSeek` helper (`src/lib/ai/client.ts:43-44`).
- **Middleware is thin** (`middleware.ts`) — region-hint only, doesn't touch DB or Redis, won't add latency on every request.

---

## Out of scope / defer to P2

- **Observability:** No APM, no structured logs, no per-route latency histogram. Defer to a dedicated monitoring ticket.
- **Cold-start mitigation:** Moving Prisma to Prisma Accelerate or an edge runtime is a larger architectural shift.
- **Image CDN:** Tarot card assets likely in `public/` — moving to Cloudflare Images / R2 is nice-to-have.
- **Streaming AI responses:** Currently all AI routes wait for full JSON before returning. Converting `/api/bazi` to Vercel AI SDK streaming would improve perceived latency but is a UX redesign.
- **DB connection pooling:** Using default Prisma pool on a single Postgres. If traffic grows, add PgBouncer / Supabase transaction pooler.
- **Full-text search on knowledge articles:** Not yet a user-facing issue.
