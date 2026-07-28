# TANGENT (ট্যানজেন্ট) — Improvement Roadmap

> **Synthesis date**: 2026-07-29
> **Sources**: [architecture-review.md](./architecture-review.md), [security-performance-review.md](./security-performance-review.md)
> **Scope**: Merged priority backlog, top 5 implementation plans, deployment sequencing

---

## Table of Contents

1. [Merged Priority Backlog](#1-merged-priority-backlog)
2. [Top 5 Implementation Plans](#2-top-5-implementation-plans)
   - [Plan A: Fix ISR/Caching Strategy](#plan-a-fix-isrcaching-strategy)
   - [Plan B: Auth + Rate Limiting + Security Headers](#plan-b-auth--rate-limiting--security-headers)
   - [Plan C: Data Model — Author/Tag/Comment Tables + Content Field](#plan-c-data-model--authortagcomment-tables--content-field)
   - [Plan D: Search Index + Query Optimization](#plan-d-search-index--query-optimization)
   - [Plan E: Frontend Performance — Memoize + Debounce + Throttle](#plan-e-frontend-performance--memoize--debounce--throttle)
3. [Deployment Sequencing](#3-deployment-sequencing)
4. [Contradictions Between Source Reviews](#4-contradictions-between-source-reviews)
5. [Quick-Win Checklist](#5-quick-win-checklist)

---

## 1. Merged Priority Backlog

All findings from both the architecture review (arch: C1–C4, I1–I7, N1–N10) and the security/performance audit (sec: CRIT-1–4, IMP-1–6, NTH-1–6) are merged below. Duplicates are consolidated with cross-references. Each item is ranked P0–P2.

### P0 — Critical (must fix before public launch)

| # | Item | Severity | Source References | Category |
|---|------|----------|-------------------|----------|
| 1 | ISR triple-config conflict (`force-dynamic` + `revalidate` + `no-store`) renders all caching non-functional; every page visit hits Supabase directly | **P0** | arch: C1, I2, N5, N6; sec: N/A | Caching / Rendering |
| 2 | No authentication / RBAC system — full public access; `persistSession: false`; no login, signup, session, or role management; `bcryptjs` unused | **P0** | arch: I6; sec: CRIT-1 | Auth / Security |
| 3 | No rate limiting anywhere — search endpoint (`ILIKE %`), RSS feed, and comment submission (when backend exists) have zero throttling; no `middleware.ts` | **P0** | sec: CRIT-2 | Security / Infrastructure |
| 4 | No Author, Tag, or Comment database tables despite `FrontendArticle` interface requiring them; author page only supports `slug=desk`; comments are entirely client-side in-memory | **P0** | arch: C2, N3, N8; sec: CRIT-3 | Data Model |
| 5 | Missing `content` field in all list query select lists (`getArticles`, `getLatestArticles`, `searchArticles`) → every `ArticleCard` renders empty excerpts and empty body on list pages | **P0** | arch: I1 | Data / UX |
| 6 | Search uses `ILIKE '%query%'` full table scan with leading-`%` wildcard — no GIN `tsvector` index despite code's own inline documentation recommending one | **P0** | arch: C3; sec: IMP-1 | Performance / Search |
| 7 | Sitemap fetches up to 999 articles with unnecessary fields (`getArticles(undefined, 1, 999)`); unbounded query risks Serverless timeout and bills for wasted rows | **P0** | arch: C4; sec: IMP-3 | Performance / SEO |

### P1 — Important (fix within first month)

| # | Item | Severity | Source References | Category |
|---|------|----------|-------------------|----------|
| 8 | CSS `--color-tangent-cobalt`, `--color-tangent-black`, `--color-tangent-red`, `--color-tangent-slate`, `--font-body` referenced via `var()` but never defined → browsers use fallback values, visible glitches on focus rings, category tags, admin buttons | **P1** | sec: CRIT-4 | Visual / Styling |
| 9 | Slug is numeric DB id (`String(article.id)`) not SEO-friendly URL; no `slug` column in DB schema; URLs like `/article/1` harm search ranking for a Bengali news site | **P1** | arch: I3 | SEO / Data Model |
| 10 | `robots.ts` disallows non-existent `/api/` path and disallows RSS feed (`/feed.xml`) — counterproductive for a news site that should promote RSS to crawlers | **P1** | arch: I7 | SEO / Config |
| 11 | HomePage client-side tab filtering operates on the same 20 fetched articles — tabs show empty if no matching article in initial batch; gives false impression of database filtering | **P1** | arch: I5 | UX / Data |
| 12 | Category page executes two sequential Supabase queries (`getArticles` + `getArticlesCount`) per load; no parallelism, no caching | **P1** | arch: I4; sec: IMP-6 | Performance |
| 13 | Article detail page runs two sequential Supabase queries (article fetch + related articles) instead of `Promise.all` | **P1** | sec: IMP-6 | Performance |
| 14 | `MutationObserver` on PageTransition watches entire `document.body` with `subtree: true` — fires `prefetchAll()` on every DOM mutation with no debounce → excessive router prefetch calls | **P1** | sec: IMP-2 | Performance |
| 15 | Scroll event listeners on `BackToTop` and `SiteHeader` attach raw listeners without throttle → ~60 state updates/sec during fast scrolling | **P1** | sec: IMP-4 | Performance |
| 16 | `ArticleCard` (20+ instances on homepage) and 3 sidebar widgets lack `React.memo` — every parent state change triggers full re-render of all instances | **P1** | sec: IMP-5 | Performance |
| 17 | `bcryptjs` dependency in `package.json` and `@types/bcryptjs` devDep are entirely unused — 6.3KB+ of dead bundle weight | **P1** | arch: I6 | Hygiene / Bundle |
| 18 | `revalidate = 60` export in `articles.ts` library module has no effect (Next.js ignores it outside segment config files); misleading dead code | **P1** | arch: I2 | Hygiene / Clarity |
| 19 | Author page uses external DiceBear API for avatar with no `<img>` fallback (`onError`); `next/image` not used; DiceBear not in `remotePatterns` | **P1** | arch: N7; sec: NTH-2 | UX / Resilience |

### P2 — Nice-to-Have (backlog)

| # | Item | Severity | Source References | Category |
|---|------|----------|-------------------|----------|
| 20 | No database indexes on `created_at` or `category` columns — queries degrade as table grows | **P2** | arch: N1 | Performance |
| 21 | Hardcoded Supabase default URL and anon key in source — key rotation would silently break app; anyone with source uses this Supabase project | **P2** | sec: NTH-1 | Security / Config |
| 22 | No security headers: no CSP, no X-Frame-Options, no X-Content-Type-Options in `next.config.ts` or `layout.tsx` | **P2** | sec: NTH-4 | Security |
| 23 | No Zod runtime validation on Supabase API data — `zod` installed but unused; TypeScript `Article` interface trusted blindly | **P2** | sec: NTH-6 | Resilience |
| 24 | Stale `app_backup/` directory with old layout/page files; duplicate `Idea.md` = `project.md` — confusion risk and maintenance burden | **P2** | sec: NTH-3 | Hygiene |
| 25 | Newsletter widget stores subscription in `useState` only (lost on refresh); social follow has hardcoded follower counts and `href="#"` links | **P2** | arch: N4; sec: NTH-5 | UX / Placeholder |
| 26 | Global `fetch` override in Supabase client (`cache: 'no-store'`) affects all Supabase requests including auth/storage, not just data queries | **P2** | arch: N5 | Config |
| 27 | `isPlaceholder` flag hardcoded to `false` — dead code path; should be env-var-driven if kept | **P2** | arch: N2 | Hygiene |
| 28 | Missing `force-dynamic` on search page and RSS route — pattern inconsistency with rest of app; RSS route is only route with real cache headers | **P2** | arch: N6 | Consistency |
| 29 | No image optimization `formats`, `deviceSizes`, `imageSizes`, or `minimumCacheTTL` in `next.config.ts`; only 2 remote pattern entries | **P2** | arch: N9 | Optimization |
| 30 | `formatDateShort` is an exact passthrough to `formatDate` with no distinct behavior — unused anywhere; either remove or differentiate | **P2** | arch: N10 | Hygiene |
| 31 | `SocialFollowWidget` in sidebar uses `href="#"` (dead anchors) while `Footer` has real URLs — inconsistency across components | **P2** | sec: NTH-5 | UX |
| 32 | Author avatar uses plain `<img>` instead of `next/image`; `dicebear.com` not in `remotePatterns` | **P2** | sec: NTH-2 | Optimization |
| 33 | No server-side validation layer for comments (no zod, no sanitize-html, no DOMPurify) — risk when DB backend is connected | **P2** | sec: CRIT-3 (residual) | Security |

### Summary Counts

| Tier | Count | Key Themes |
|------|-------|------------|
| **P0** | 7 | Caching broken, no auth, no rate limiting, data model gaps, missing content field, search un-indexed, sitemap unbounded |
| **P1** | 12 | CSS glitches, SEO issues, sequential queries, MutationObserver/scroll perf, missing React.memo, dead code and deps |
| **P2** | 14 | Index hygiene, security headers, Zod validation, stale files, config consistency, image optimization |
| **Total** | **33** | Across 19 architecture + 16 security findings (deduplicated) |

---

## 2. Top 5 Implementation Plans

---

### Plan A: Fix ISR/Caching Strategy

**Goal**: Resolve the triple-config conflict so caching actually works on the live site, reducing Supabase load and improving TTFB.

**Priority**: P0 — #1 on backlog (ISR is the foundation the entire rendering strategy rests on)

**Files touched**:

| File | Change |
|------|--------|
| `src/app/page.tsx` | Remove `export const dynamic = "force-dynamic"`; keep `revalidate = 60` |
| `src/app/article/[slug]/page.tsx` | Remove `export const dynamic = "force-dynamic"`; keep `revalidate = 60` |
| `src/app/category/[slug]/page.tsx` | Remove `export const dynamic = "force-dynamic"`; keep `revalidate = 60` |
| `src/app/author/[slug]/page.tsx` | Remove `export const dynamic = "force-dynamic"`; keep `revalidate = 60` |
| `src/app/search/page.tsx` | Add `export const dynamic = "force-dynamic"` (search must always be live) |
| `src/app/feed.xml/route.ts` | Add `export const dynamic = "force-dynamic"` (or keep `Cache-Control` header) |
| `src/lib/supabase.ts` | Remove or narrow the `fetch` override — only apply `no-store` selectively where needed |
| `src/lib/articles.ts` | Remove dead `export const revalidate = 60` from library module (line 102) |
| `project.md` | Update §4.A to reflect the chosen caching strategy |

**Rough effort**: S (hours)

**Tech-stack changes**: None

**Tradeoffs**:
| Gain | Cost |
|------|------|
| ISR actually caches pages → 10–100× fewer Supabase queries on repeated visits | Pages serve stale data for up to 60s after DB updates (acceptable for news) |
| Lower Vercel Serverless execution cost | Must explicitly tag search page and RSS route as dynamic |
| Better TTFB for most page views | Small complexity in explaining which routes are ISR vs dynamic |
| Existing pages remain fully functional | None — config-only change, no logic altered |

**Implementation steps**:

1. **On each page file** (`page.tsx`, `article/[slug]/page.tsx`, `category/[slug]/page.tsx`, `author/[slug]/page.tsx`):
   - Remove `export const dynamic = "force-dynamic";`
   - Verify `export const revalidate = 60;` is present (it already is)
2. **On `src/app/search/page.tsx`**: Add `export const dynamic = "force-dynamic";` (search results must be real-time)
3. **On `src/app/feed.xml/route.ts`**: Add `export const dynamic = "force-dynamic";` for consistency, OR keep the existing `Cache-Control: public, max-age=3600` header approach
4. **On `src/lib/supabase.ts`**: Remove the global `fetch` override (`{ ...options, cache: 'no-store' }`) — let Next.js manage caching via ISR. If individual queries need no-store, add it at the call site
5. **On `src/lib/articles.ts`**: Remove line 102 `export const revalidate = 60;` — it has no effect here
6. **Verify**: Deploy to staging; confirm page returns `Cache-Control` header via `curl -I`; trigger a content update and confirm page revalidates within 60s
7. **Update `project.md`**: Document the chosen strategy: ISR with `revalidate=60` for content pages, `force-dynamic` for search and RSS

---

### Plan B: Auth + Rate Limiting + Security Headers

**Goal**: Implement foundational security — auth/RBAC, request rate limiting, and security headers — so the site is not completely open to abuse.

**Priority**: P0 — #2 & #3 on backlog

**Files touched**:

| File | Change |
|------|--------|
| `src/middleware.ts` | **New file** — rate limiting middleware + security headers |
| `src/app/api/auth/...` | **New directory** — auth route handlers (login, signup, logout, session) |
| `src/lib/supabase.ts` | Enable `persistSession: true`; configure auth callbacks |
| `src/lib/auth.ts` | **New file** — auth helpers (getSession, requireAuth, requireRole) |
| `src/components/SiteHeader.tsx` | Wire Login/Subscribe buttons to actual auth routes |
| `src/components/CommentSection.tsx` | Add auth guard before allowing comment submission |
| `package.json` | Add `@upstash/ratelimit`, `@upstash/redis` (or edge-compatible rate limiter) |
| `next.config.ts` | Add async `headers()` for CSP, X-Frame-Options, X-Content-Type-Options |
| `.env.local` / Vercel env vars | Add `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `NEXT_PUBLIC_SITE_URL` |
| `src/app/layout.tsx` | (Optional) Add `<meta>` CSP via `next/script` if headers not sufficient |
| `src/lib/supabase.ts` | Remove hardcoded default URL/anon key; rely solely on env vars |
| `project.md` | Add auth architecture section |

**Rough effort**: M (1–3 days)

**Tech-stack changes**:
- `@upstash/ratelimit` + `@upstash/redis` for serverless-compatible rate limiting
- `zod` (already installed) for request body validation on auth endpoints
- Supabase Auth SDK (already installed via `@supabase/supabase-js`)

**Tradeoffs**:
| Gain | Cost |
|------|------|
| Search, RSS, and comment APIs are protected from abuse | Redis dependency for rate limiting (Upstash is free-tier friendly) |
| Login/Subscribe buttons become functional | Auth adds complexity; must handle token refresh, session expiry |
| Security headers protect against XSS/clickjacking | CSP can be tricky to configure without breaking inline scripts |
| Role-based access for future editor/admin workflows | Admin panel not part of this scope — just foundation |

**Implementation steps**:

1. **Install Upstash** — `npm install @upstash/ratelimit @upstash/redis`; configure `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` in `.env.local`
2. **Create `src/middleware.ts`**:
   - Apply rate limiting on `/search`, `/feed.xml`, and any future API routes (e.g., 10 req/s for search, 100 req/min for RSS, 5 req/min for comments)
   - Set security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
   - Exclude static assets and Next.js internals from rate limiting
3. **Update `src/lib/supabase.ts`**:
   - Set `persistSession: true`
   - Remove `DEFAULT_URL` and `DEFAULT_ANON_KEY` hardcoded fallbacks — rely 100% on env vars
4. **Create `src/lib/auth.ts`**:
   - `getSession()` — reads Supabase session from cookies
   - `requireAuth()` — redirects to login if unauthenticated
   - `requireRole('editor' | 'admin')` — for future author/editor functionality
5. **Create `src/app/api/auth/` routes**:
   - `login/route.ts` — email/password or magic link via Supabase Auth
   - `signup/route.ts`
   - `logout/route.ts`
   - `session/route.ts` — returns current session state
6. **Wire `SiteHeader.tsx`** buttons to link to `/login` and `/signup` pages or modals
7. **Add `src/app/login/page.tsx`** and **`src/app/signup/page.tsx`** — minimal auth UI
8. **Add security headers in `next.config.ts`**: `async headers()` returning CSP, frame-options, content-type-options
9. **Verify**: Run `curl -I` to check security headers; send 20 rapid requests to `/search` to confirm rate limiting kicks in after threshold; test login flow end-to-end

---

### Plan C: Data Model — Author/Tag/Comment Tables + Content Field

**Goal**: Add missing database tables (authors, tags, article_tags, comments), wire them into the code, persist comments server-side, and fix the missing `content` field in list queries so excerpts render.

**Priority**: P0 — #4 & #5 on backlog

**Files touched**:

| File | Change |
|------|--------|
| Supabase SQL (migration) | **New migration**: `CREATE TABLE authors`, `CREATE TABLE tags`, `CREATE TABLE article_tags`, `CREATE TABLE comments`, add `slug` column to articles, add indexes |
| `src/lib/supabase.ts` | Add table references for new tables |
| `src/lib/articles.ts` | Update `FrontendArticle` type; update `mapArticle()` to join author/tags from DB; add `content` to list query selects; add server-side comment persistence functions |
| `src/lib/comments.ts` | **New file** — comment CRUD (create, list, validate) |
| `src/lib/authors.ts` | **New file** — author data access |
| `src/lib/tags.ts` | **New file** — tag data access |
| `src/components/CommentSection.tsx` | Rewrite to call backend API instead of `useState`; add server-side validation; remove hardcoded seed data |
| `src/app/api/comments/route.ts` | **New file** — API endpoint for comment submission |
| `src/app/api/comments/[articleId]/route.ts` | **New file** — API endpoint to fetch comments for an article |
| `src/app/author/[slug]/page.tsx` | Fetch from `authors` table instead of hardcoded "desk" only; add fallback image error handler |
| `src/app/article/[slug]/page.tsx` | Enable tags rendering from DB data; remove commented-out tags code |
| `src/components/SidebarWidgets.tsx` | Wire newsletter subscribe to a backend endpoint |
| `src/app/api/newsletter/route.ts` | **New file** — newsletter subscription endpoint |
| `project.md` | Update schema definition (§5) with all new tables |

**Rough effort**: M–L (3–5 days)

**Tech-stack changes**:
- `zod` (already installed) — validate comment submission and newsletter input
- `sanitize-html` or `DOMPurify` (new dependency) — sanitize comment body server-side
- Supabase migration tooling (already have Supabase access)

**Tradeoffs**:
| Gain | Cost |
|------|------|
| Author pages work for all authors (not just "desk") | Migration must be backward-compatible: existing articles get a default author |
| Comments persisted to DB — no longer lost on refresh | Comment moderation not included (future work) |
| Tags render on article pages from actual DB data | Newsletter endpoint is basic — no double-opt-in or email delivery yet |
| All list pages show real excerpts | Added code complexity: 3 new data-access modules |
| Content field now fetched renders article bodies | Bandwidth increase from fetching `content` in list queries |

**Implementation steps** (in dependency order):

1. **Run DB migrations** (must happen BEFORE any code changes):
   - `CREATE TABLE authors (id SERIAL PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, bio TEXT, avatar_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`
   - `CREATE TABLE tags (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL)`
   - `CREATE TABLE article_tags (article_id INTEGER REFERENCES articles(id), tag_id INTEGER REFERENCES tags(id), PRIMARY KEY (article_id, tag_id))`
   - `CREATE TABLE comments (id SERIAL PRIMARY KEY, article_id INTEGER REFERENCES articles(id), author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`
   - `ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;` — populate from title (transliterate or use UUID); add unique index
   - `CREATE INDEX idx_articles_slug ON articles(slug);`
   - `ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES authors(id);`
   - Seed a default author ("বাংলানিউজ ডেস্ক") that existing articles point to
2. **Add `content` to list queries**: In `getArticles()`, `getLatestArticles()`, `searchArticles()`, expand select list to include `'content'`
3. **Create `src/lib/authors.ts`**: `getAuthorBySlug()`, `getAuthorById()`
4. **Create `src/lib/tags.ts`**: `getTagsForArticle()`, `getAllTags()`
5. **Create `src/lib/comments.ts`**: `createComment()`, `getCommentsForArticle()`, with Zod validation schemas
6. **Rewrite `CommentSection.tsx`**:
   - Remove hardcoded seed comments
   - On submit: POST to `/api/comments` with `authorName` + `body`
   - On mount: GET comments from `/api/comments/[articleId]`
   - Add loading states and error handling
7. **Create comment API routes**: `src/app/api/comments/route.ts` (POST), `src/app/api/comments/[articleId]/route.ts` (GET)
8. **Update `author/[slug]/page.tsx`** to query `authors` table; remove hardcoded "desk" guard; add `<img onError>` fallback
9. **Update `article/[slug]/page.tsx`** to render tags from DB; remove dead code
10. **Update `SidebarWidgets.tsx`** — wire newsletter to a simple POST endpoint (can use a `newsletter_subscriptions` table or integrate with a third-party service later)
11. **Verify**: Insert test articles with multiple authors and tags; confirm all author pages render; submit a comment and refresh page — it persists; confirm excerpts show on homepage

---

### Plan D: Search Index + Query Optimization

**Goal**: Replace the full-table-scan search with PostgreSQL full-text search (GIN index), limit the sitemap query, add performance indexes, and parallelize sequential Supabase queries.

**Priority**: P0 — #6 & #7 on backlog

**Files touched**:

| File | Change |
|------|--------|
| Supabase SQL (migration) | **New migration**: Add GIN `tsvector` index on `title`, add composite index `(category, created_at desc)`, add simple index `created_at desc` |
| `src/lib/articles.ts` | Rewrite `searchArticles()` to use `to_tsvector`/`to_tsquery`; parallelize article+related queries; add `SitemapArticle` select list for sitemap |
| `src/app/sitemap.ts` | Reduce page size from 999 to 500; select only `slug, created_at`; paginate with cursor-based approach |
| `src/app/category/[slug]/page.tsx` | Parallelize `getArticles` + `getArticlesCount` with `Promise.all` |
| `src/app/article/[slug]/page.tsx` | Parallelize article fetch + related articles with `Promise.all` |
| `project.md` | Document full-text search architecture |

**Rough effort**: M (2–3 days)

**Tech-stack changes**: None (pure PostgreSQL + code changes)

**Tradeoffs**:
| Gain | Cost |
|------|------|
| Search becomes O(log n) via GIN index instead of O(n) scan | Full-text search has different behavior than `ILIKE` — "বাংলাদেশ" won't match "বাংলাদেশী" unless stemming configured |
| Sitemap generation is faster and cheaper | Paginated sitemap means multiple sitemap index files if >50K articles (not an issue at launch) |
| Category page loads 2× faster (parallel queries) | None |
| Composite index accelerates category-filtered sorted queries | Minor write overhead on indexes (negligible for read-heavy news site) |

**Implementation steps** (in dependency order):

1. **Run DB migrations** (BEFORE code changes):
   - `CREATE INDEX idx_articles_created_at ON articles(created_at DESC);`
   - `CREATE INDEX idx_articles_category_created ON articles(category, created_at DESC);`
   - `CREATE INDEX idx_articles_search ON articles USING GIN(to_tsvector('bengali', coalesce(title, '')));`
   - Note: PostgreSQL's default `'bengali'` text search config may need custom dictionary for Bengali stemming; if not available, use `'simple'` with `websearch_to_tsquery`
2. **Rewrite `searchArticles()`** in `src/lib/articles.ts`:
   - Replace `.ilike('title', '%${query}%')` with `.textSearch('title', query, { config: 'bengali' })` (Supabase SDK supports this)
   - Or use raw SQL: `to_tsvector('bengali', title) @@ plainto_tsquery('bengali', $1)`
   - Add ranking: `ORDER BY ts_rank(to_tsvector('bengali', title), plainto_tsquery('bengali', $1)) DESC`
   - Keep the ILIKE fallback for when the query is very short (<3 chars)
3. **Optimize sitemap**:
   - Change `getArticles(undefined, 1, 999)` → `getArticles(undefined, 1, 500)` with pagination
   - Create a dedicated `getSitemapArticles()` function that selects only `'id, slug, created_at'`
   - Implement cursor-based pagination for when articles exceed 500 (loop `offset` in 500-page chunks)
4. **Parallelize category page** (`src/app/category/[slug]/page.tsx`):
   - Change:
     ```ts
     const [articles, totalArticles] = await Promise.all([
       getArticles(dbCategory, currentPage, ITEMS_PER_PAGE),
       getArticlesCount(dbCategory),
     ]);
     ```
5. **Parallelize article detail page** (`src/app/article/[slug]/page.tsx`):
   - Change:
     ```ts
     const [article, relatedArticles] = await Promise.all([
       getArticleById(decodedSlug),
       getArticles(article.category.id, 1, 4),
     ]);
     ```
   - Note: You need the article first to know its category — use `Promise.all` only after article fetch, OR do a single query with a subquery
6. **Verify**: Run search with various Bengali queries; `EXPLAIN ANALYZE` shows index scan not seq scan; confirm sitemap returns exactly 500 items; category and article pages load with parallel requests visible in Supabase logs

---

### Plan E: Frontend Performance — Memoize + Debounce + Throttle

**Goal**: Reduce unnecessary re-renders and scroll handler overhead with targeted memoization, debounced MutationObserver, and throttled scroll listeners.

**Priority**: P1 — #14, #15, #16 on backlog

**Files touched**:

| File | Change |
|------|--------|
| `src/components/ArticleCard.tsx` | Wrap with `React.memo` |
| `src/components/Pagination.tsx` | Wrap with `React.memo` |
| `src/components/SidebarWidgets.tsx` | Wrap `NewsletterWidget`, `SocialFollowWidget`, `TrendingRailWidget` with `React.memo` |
| `src/components/PageTransition.tsx` | Debounce `MutationObserver` callback; use a ref-based approach to avoid re-creating observer on renders |
| `src/components/BackToTop.tsx` | Throttle scroll listener (requestAnimationFrame or 100ms throttle) |
| `src/components/SiteHeader.tsx` | Throttle scroll listener (requestAnimationFrame or 100ms throttle) |
| `src/components/HomePage.tsx` | Memoize `tabFilteredArticles` with `useMemo` |

**Rough effort**: S–M (1–2 days)

**Tech-stack changes**: None (pure React patterns)

**Tradeoffs**:
| Gain | Cost |
|------|------|
| ArticleCard re-renders only when props change — big savings on home page with 20+ cards | `React.memo` adds shallow prop comparison overhead (negligible) |
| PageTransition observer fires 90%+ less often | Debounce introduces 100–200ms latency before prefetch kicks in (acceptable — user isn't navigating during DOM churn) |
| Scroll handlers fire at 1–2 events/sec instead of 60/sec | Throttled scroll means 16–50ms delay in updating `scrolled`/`visible` state (imperceptible to users) |
| Tab filter on homepage doesn't re-render entire article grid | `useMemo` adds minor memory overhead for cached computation |

**Implementation steps**:

1. **Memoize ArticleCard** (`src/components/ArticleCard.tsx`):
   - Change `export default function ArticleCard(...)` → `export default React.memo(function ArticleCard(...))`
   - Ensure all props are primitive or stable references (pass `category` as primitive slug/name, not inline objects)
2. **Memoize Pagination** (`src/components/Pagination.tsx`):
   - Wrap with `React.memo`
3. **Memoize sidebar widgets** (`src/components/SidebarWidgets.tsx`):
   - Wrap each exported widget function with `React.memo`
4. **Debounce MutationObserver** (`src/components/PageTransition.tsx`):
   - Import `useRef` and `useEffect`
   - Wrap `prefetchAll` in a debounced function (200ms debounce)
   - Store debounce timeout ID in a ref
   - On observer callback: clear previous timeout, set new one
   - Cleanup on unmount
5. **Throttle BackToTop scroll** (`src/components/BackToTop.tsx`):
   - Use `requestAnimationFrame` pattern:
     ```ts
     let ticking = false;
     window.addEventListener("scroll", () => {
       if (!ticking) {
         requestAnimationFrame(() => {
           toggleVisibility();
           ticking = false;
         });
         ticking = true;
       }
     });
     ```
6. **Throttle SiteHeader scroll** (`src/components/SiteHeader.tsx`):
   - Same `requestAnimationFrame` pattern as BackToTop
7. **Memoize homepage tab filter** (`src/components/HomePage.tsx`):
   - Wrap `tabFilteredArticles` computation in `useMemo` with `[articles, activeTab]` deps
8. **Verify**: Use React DevTools profiler — render time for homepage should drop measurably after tab switch; open Performance tab, check scroll handler frequency reduced from 60fps to rAF-synced; PageTransition observer shows far fewer prefetch calls in network tab

---

## 3. Deployment Sequencing

All work is sequenced so the live site never breaks. The golden rule: **DB migrations first, code second; feature flags for risky changes; backward-compatible deploys at every step.**

### Phase 0 — Pre-work (cleanup, no risk)
*Estimated: 1 hour*

| Step | Action | Risk | Reason |
|------|--------|------|--------|
| 0.1 | Remove `bcryptjs` + `@types/bcryptjs` from `package.json` | None | Dead dependency |
| 0.2 | Remove `formatDateShort` from `src/lib/utils.ts` | None | Unused duplicate |
| 0.3 | Remove `Idea.md` duplicate | None | Prevents confusion |
| 0.4 | Remove `app_backup/` directory | None | Stale copy |
| 0.5 | Fix `robots.ts` — remove `/api/` disallow; keep or remove RSS disallow after team discussion | Low | Currently harmless but SEO fix is quick |
| 0.6 | Define CSS custom properties for `--color-tangent-*` and `--font-body` in `globals.css` | Low | Visual fix — renders existing features correctly |

### Phase 1 — Caching foundation (Plan A)
*Estimated: 1 day*
**No DB changes, no breaking changes.**

| Step | Action | Dependencies |
|------|--------|-------------|
| 1.1 | Remove `force-dynamic` from 4 page files | None |
| 1.2 | Add `force-dynamic` to search page + RSS route | None |
| 1.3 | Remove global `fetch` override from `supabase.ts` | None |
| 1.4 | Remove dead `revalidate = 60` from `articles.ts` | None |
| 1.5 | Deploy to staging, verify ISR headers via curl | 1.1–1.4 |
| 1.6 | Deploy to production | 1.5 |

**Verification**: `curl -I https://staging.example.com` returns `Cache-Control: s-maxage=60, stale-while-revalidate`. Repeat visit hits CDN cache, not Supabase.

### Phase 2 — Schema migrations (Plan C DB + Plan D DB)
*Estimated: 1 day*
**Backward-compatible: all new columns have defaults or are nullable. Existing code runs unchanged.**

| Step | Action | Dependencies |
|------|--------|-------------|
| 2.1 | Create `authors` table, seed default "বাংলানিউজ ডেস্ক" | Phase 1 deployed |
| 2.2 | `ALTER TABLE articles ADD COLUMN author_id` (nullable) | 2.1 |
| 2.3 | Create `tags` table | None |
| 2.4 | Create `article_tags` junction table | 2.3 |
| 2.5 | Create `comments` table | None |
| 2.6 | `ALTER TABLE articles ADD COLUMN slug` (nullable), populate from id | None |
| 2.7 | Create GIN `tsvector` index on `articles.title` | None |
| 2.8 | Create `idx_articles_created_at` and `idx_articles_category_created` indexes | None |
| 2.9 | Deploy all migrations | 2.1–2.8 |
| 2.10 | Verify existing pages still work (no 500 errors, homepage renders) | 2.9 |

**Safety check**: ALL new columns are `ADD COLUMN ... DEFAULT NULL` or `ADD COLUMN ... IF NOT EXISTS`. No existing query breaks because no code references these columns yet.

### Phase 3 — Auth + Rate Limiting (Plan B) — Feature-flagged
*Estimated: 2–3 days*
**Feature flag behind env var `AUTH_ENABLED` — default `false`. Deploy with flag off, enable when ready.**

| Step | Action | Dependencies |
|------|--------|-------------|
| 3.1 | Install `@upstash/ratelimit`, `@upstash/redis` | None |
| 3.2 | Create `src/middleware.ts` with rate limiting + security headers | 3.1 |
| 3.3 | Create `src/lib/auth.ts` with session helpers | None |
| 3.4 | Create `src/app/api/auth/*` routes | 3.3 |
| 3.5 | Update `src/lib/supabase.ts`: `persistSession: true`, remove hardcoded fallbacks | None |
| 3.6 | Add security headers in `next.config.ts` | None |
| 3.7 | Wire Login/Subscribe buttons in `SiteHeader.tsx` | 3.4 |
| 3.8 | Deploy everything with `AUTH_ENABLED=false` — auth routes exist but Login button links to placeholder | None |
| 3.9 | Team enables `AUTH_ENABLED=true` on staging, test full flow | 3.8 |
| 3.10 | Enable in production | 3.9 |

**Rollback**: Set `AUTH_ENABLED=false` — Login/Subscribe become inert buttons again.

### Phase 4 — Backend code: content, comments, search, sitemap (Plan C code + Plan D code)
*Estimated: 3–4 days*
**All DB migrations already deployed (Phase 2). Code can safely reference new tables.**

| Step | Action | Dependencies |
|------|--------|-------------|
| 4.1 | Add `content` to all list query select lists in `articles.ts` | Phase 2 deployed |
| 4.2 | Rewrite `searchArticles()` to use GIN full-text search | Phase 2.7 (GIN index exists) |
| 4.3 | Create `src/lib/authors.ts`, `src/lib/tags.ts`, `src/lib/comments.ts` | Phase 2.1–2.5 |
| 4.4 | Rewrite `CommentSection.tsx` to use backend API | Phase 2.5 |
| 4.5 | Create comment API routes (`/api/comments/...`) | 4.3 |
| 4.6 | Update `author/[slug]/page.tsx` to query `authors` table | Phase 2.1–2.2 |
| 4.7 | Update `article/[slug]/page.tsx` to render tags from DB | Phase 2.3–2.4 |
| 4.8 | Optimize sitemap: reduce page size, add pagination, slim select | Phase 2.6 (slug column) |
| 4.9 | Parallelize sequential queries on category + article pages | None |
| 4.10 | Wire newsletter subscribe to backend endpoint | Phase 2 (or use separate table) |
| 4.11 | Deploy all to staging, test every page type | 4.1–4.10 |
| 4.12 | Deploy to production | 4.11 |

**Risk mitigation**: Deploy in sub-batches if large — e.g., deploy content field fix (4.1) alone first, since it fixes silent UX bug with minimal risk.

### Phase 5 — Frontend performance (Plan E)
*Estimated: 1–2 days*
**Pure frontend changes — no DB, no API changes.**

| Step | Action | Dependencies |
|------|--------|-------------|
| 5.1 | Wrap `ArticleCard`, `Pagination`, sidebar widgets with `React.memo` | None |
| 5.2 | Debounce `MutationObserver` in `PageTransition.tsx` | None |
| 5.3 | Throttle scroll listeners in `BackToTop.tsx` and `SiteHeader.tsx` | None |
| 5.4 | Memoize `tabFilteredArticles` in `HomePage.tsx` | None |
| 5.5 | Deploy all — no breaking changes possible | None |

### Phase 6 — Nice-to-haves (P2 backlog)
*Estimated: Ongoing — pick items per sprint*

| Priority | Item | Effort | When |
|----------|------|--------|------|
| 6.1 | Database indexes on `created_at` and `category` | S | Any time (read perf) |
| 6.2 | Zod validation on Supabase API data | S | Any time (resilience) |
| 6.3 | Security headers — CSP refinement | S | Any time |
| 6.4 | Remove hardcoded Supabase fallback credentials | S | After env var verification |
| 6.5 | `isPlaceholder` env-var-driven or removed | S | Cleanup |
| 6.6 | `next/image` for author avatar + DiceBear in `remotePatterns` | S | Optimization |
| 6.7 | Image optimization config (`formats`, `deviceSizes`, etc.) | S | Build perf |
| 6.8 | Social links: replace `href="#"` with real URLs | S | UX |
| 6.9 | Real social follow counts (via API or static) | M | UX |

### Gantt Summary

```
Week 1     | Phase 0 (cleanup) → Phase 1 (caching) → Phase 2 (migrations)
Week 2     | Phase 3 (auth+rate-limit) — feature-flagged deploy mid-week
Week 3     | Phase 4 (backend code: content, comments, search, sitemap)
Week 4     | Phase 5 (frontend perf) → Phase 6 begins (nice-to-haves)
```

---

## 4. Contradictions Between Source Reviews

Both reviews are consistent on all substantive findings. The following minor notes are flagged for awareness:

| Topic | Architecture Review | Security Audit | Resolution |
|-------|-------------------|----------------|------------|
| **CSS variables** | Not mentioned | CRIT-4 — 5 undefined `var()` references | Arch review did not include CSS analysis scope; no contradiction — security audit adds a genuine finding |
| **`bcryptjs` unused** | I6 — noted as unused dependency | CRIT-1 — mentions `bcryptjs` unused as supporting evidence of no auth | Consistent; no conflict |
| **Hardcoded Supabase credentials** | N2/`isPlaceholder` mentions config, not credentials specifically | NTH-1 — flags hardcoded URL + anon key | Arch review's `isPlaceholder` finding is distinct; NTH-1 is a separate finding the arch review did not flag (different scope) |
| **Security headers** | Not mentioned | NTH-4 — no CSP or security headers | Not a contradiction — security audit covers scope arch review didn't |
| **Priority of search fix** | C3 (Critical) | IMP-1 (Important) | **Minor discrepancy**: Arch review rates it Critical, security audit rates it Important. This roadmap assigns **P0 (Critical)** because the code's own comments document the fix and the search is consumer-facing with a live deployment pending. **Resolved in favor of P0.** |
| **Priority of sitemap query** | C4 (Critical) | IMP-3 (Important) | **Minor discrepancy**: Arch review rates it Critical, security audit rates it Important. This roadmap assigns **P0 (Critical)** because on Vercel Serverless an unbounded 999-row query poses a real timeout risk for frequently-crawled sitemaps. **Resolved in favor of P0.** |

---

## 5. Quick-Win Checklist

Items that can be done in under 30 minutes with no migration or deployment risk:

- [x] Remove `bcryptjs` + `@types/bcryptjs` from `package.json`
- [x] Remove `formatDateShort` from `src/lib/utils.ts`
- [x] Remove `app_backup/` directory
- [x] Remove `Idea.md` (keep `project.md`)
- [x] Remove `/api/` from `robots.ts` disallow
- [x] Add CSS custom property definitions for `--color-tangent-cobalt`, `--color-tangent-black`, `--color-tangent-red`, `--color-tangent-slate`, `--font-body` in `:root` in `globals.css`
- [x] Remove `export const revalidate = 60;` from `src/lib/articles.ts` (line 102)
- [x] Remove `export const dynamic = "force-dynamic";` from 4 page files
- [x] Add `export const dynamic = "force-dynamic";` to search page + RSS route
- [x] Remove global `fetch` override from `supabase.ts`

These are safe to batch into a single deployment at the start of Phase 1.
