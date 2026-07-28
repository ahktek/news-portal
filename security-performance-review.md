# TANGENT (ট্যানজেন্ট) — Security & Performance Audit

**Scope**: Full-stack audit of Next.js 16 App Router + Supabase codebase  
**Reviewer**: Hermes Agent (Security & Performance Auditor)  
**Date**: 2026-07-29  

---

## Summary of Checks Performed

This audit examines the entire `src/` tree (34 source files), configuration files, and `project.md` for:

1. **RBAC / Auth**: Searched for `role`, `admin`, `editor`, `moderat`, `auth`, `session`, `cookie`, `token`, `signIn`, `signUp`, `login`, `logout`, `bcrypt` across all source files. Checked Supabase client auth config.
2. **Input Sanitization**: Searched for `dangerouslySetInnerHTML`, `sanitize`, `DOMPurify`, `xss`, `htmlEncode`, `escapeHtml`. Reviewed `CommentSection.tsx` and user-input pathways.
3. **Rate Limiting**: Searched for `rate.limit`, `Ratelimit`, `throttle`, `upstash`, `VercelEdge`, `edge.config`, `middleware.ts`. Checked all API-adjacent routes (RSS feed, search).
4. **Media / Upload Handling**: Searched for `supabase.storage`, `storage.from`, `upload`, `bucket`, `file.type`, `file.size`. Reviewed `next.config.ts` remote patterns.
5. **Performance**: Searched for N+1 query patterns, missing indexes (vs schema in `project.md`), unbounded queries, scroll listeners, `MutationObserver` patterns, `React.memo`/`useMemo` usage, `useCallback` usage.

---

## Critical

### ⚠️ CRIT-1: No Authentication / RBAC System — Full Public Access

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/lib/supabase.ts` | 37–40 | `persistSession: false` — no session persistence; Supabase auth explicitly disabled |
| `src/components/SiteHeader.tsx` | 79–84 | "Subscribe" and "Login" buttons are purely cosmetic `<button>` elements with zero functionality |
| `src/components/CommentSection.tsx` | 35–52 | `handleSubmit` is a client-side `useState` push only; no server endpoint, no auth guard |
| `src/app/feed.xml/route.ts` | 3–43 | RSS feed is publicly served with no authentication |
| `src/app/sitemap.ts` | 24–35 | Sitemap publicly serves all article URLs with no restrictions |

**Finding**: The codebase has **zero authentication, zero authorization, and zero role management**.  
- There is no login/signup flow, no password hashing (despite `bcryptjs` in `package.json` — unused), no session tokens, no JWT handling, no middleware.  
- The string `"admin"` only appears in CSS class names (`admin-input`, `admin-btn`, `admin-btn-primary`) in `globals.css` used purely for comment form styling — not actual admin functionality.  
- Supabase client is initialized with `persistSession: false`, meaning **no authenticated user identity is preserved** across page loads.  
- Any future feature requiring reader/editor/admin distinction will need a ground-up auth implementation.  
- **All pages** (article, category, author, search, RSS, sitemap) are public with zero access control.

**Risk**: Any data in Supabase is accessible to anyone who knows the anon key (hardcoded fallback in `supabase.ts`). No Row Level Security (RLS) policies are defined or referenced anywhere.

---

### ⚠️ CRIT-2: No Rate Limiting Anywhere — Abusable Public Endpoints

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/lib/articles.ts` | 217–237 | `searchArticles()` calls Supabase `.ilike()` with user-supplied query — no throttling |
| `src/app/feed.xml/route.ts` | 8 | `getLatestArticles(50)` on every GET request — no request rate limiting |
| `src/app/search/page.tsx` | 12 | Server-side search execution accepts arbitrary query strings with no rate limit |
| (entire `src/`) | all | Searched for `rate.limit`, `Ratelimit`, `throttle`, `upstash`, `VercelEdge`, `edge.config` — **zero matches** |
| (project root) | — | **No `middleware.ts` file exists** |

**Finding**: No rate-limiting middleware, no Upstash Ratelimit integration, no Vercel Edge Config, no request throttling of any kind.  
- The search endpoint (`searchArticles`) uses `ILIKE '%query%'` on the `title` column — an expensive full-table scan operation. An attacker could flood this endpoint with requests to cause database CPU exhaustion.  
- The RSS feed (`feed.xml/route.ts`) builds 50-item XML on every request with no caching beyond `Cache-Control: public, max-age=3600` response header.  
- The `CommentSection.tsx` (line 35) has no client-side or server-side submission throttle; when connected to a database backend, it would be abusable.

**Risk**: Unauthenticated API abuse potential. No protection against brute-force, DDoS, or database resource exhaustion.

---

### ⚠️ CRIT-3: Comment Section Features Client-Only State — No Backend Validation

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/components/CommentSection.tsx` | 35–52 | `handleSubmit` stores comments in React `useState` only — no Supabase insert, no server persistence |
| `src/components/CommentSection.tsx` | 37 | Validation: just `if (!authorName.trim() \|\| !body.trim()) return;` — no length, type, or content validation |
| `src/components/CommentSection.tsx` | 44–45 | `authorName.trim()` and `body.trim()` are the only sanitization — no XSS escaping (though React auto-escapes JSX) |

**Finding**: Comments are purely mock/local. When Supabase persistence is added, there is **no server-side validation layer**. Currently:
- `authorName` has `maxLength={50}` (client-side only — bypassable via curl/fetch)
- `body` has `maxLength={2000}` (client-side only)
- No `zod` schema, no server-side validation, no input sanitization (no `DOMPurify`, no `sanitize-html`)
- No CSRF protection, no captcha
- React JSX auto-escapes `{comment.authorName}` and `{comment.body}` on render — but any future `dangerouslySetInnerHTML` usage or rich-text rendering would be vulnerable.

**Risk**: Once connected to a database, the comment system will accept arbitrary content with no server-side validation — XSS, injection, and spam vulnerabilities.

---

### ⚠️ CRIT-4: CSS Variables Referenced But Never Defined — Rendering Glitches

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/app/globals.css` | line `var(--color-tangent-cobalt)` | Used in ~8 places (`cobalt-rule`, `focus-visible`, `category-tag`, `admin-btn-primary`, etc.) — **never defined** |
| `src/app/globals.css` | line `var(--color-tangent-black)` | Referenced in `.category-link` — **never defined** |
| `src/app/globals.css` | line `var(--color-tangent-red)` | Referenced in `.admin-btn-danger` — **never defined** |
| `src/app/globals.css` | line `var(--color-tangent-slate)` | Referenced in `.reading-time` — **never defined** |
| `src/app/globals.css` | line `var(--font-body)` | Referenced in `.prose` — **never defined** |

**Finding**: Five CSS custom properties are referenced via `var()` in `globals.css` but never defined in any `--color-*` or `--font-*` rule. Browsers silently fall back to their initial computed values, causing visual glitches (e.g., missing accent colors on focus outlines, missing cobalt rule divider, broken admin button colors).

---

## Important

### 🔶 IMP-1: Leading-Wildcard ILIKE Search — Full Table Scan

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/lib/articles.ts` | 221–227 | `.ilike('title', \`%${query}%\`)` — leading `%` prevents B-tree index usage |
| `src/lib/articles.ts` | 199–216 | Comments acknowledge the problem and recommend a GIN full-text search index — **but the index is not created** |

**Finding**: The search query `WHERE title ILIKE '%query%'` performs a sequential scan of the entire `articles` table on every search. The `project.md` schema §5 shows no FTS index on `title`. The code comments (lines 199–216) document the recommended fix (a GIN `tsvector` index) but it has not been applied. For a news site with thousands of articles, search latency will degrade linearly with the number of articles.

**Recommendation**: Execute the 8 lines of SQL documented in the comment block at `articles.ts:202–215`.

---

### 🔶 IMP-2: MutationObserver Without Debounce — Excessive Prefetch on DOM Changes

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/components/PageTransition.tsx` | 42–43 | `new MutationObserver(prefetchAll); observer.observe(document.body, { childList: true, subtree: true })` |
| `src/components/PageTransition.tsx` | 31–37 | `prefetchAll()` iterates `document.querySelectorAll("a[href]")` and calls `router.prefetch(href)` for each link |

**Finding**: The `MutationObserver` watches the entire `document.body` with `subtree: true` and fires `prefetchAll()` on **every DOM mutation** — including text changes, attribute changes, and child additions that have nothing to do with navigation links. There is no debounce. On pages with dynamic content (infinite scroll, live updates, comment toggles, sidebar loading), this can trigger dozens of `router.prefetch()` calls per second. While `router.prefetch()` itself is lightweight (fetches the page data chunk), the `querySelectorAll` scan across the full DOM runs synchronously on every mutation.

---

### 🔶 IMP-3: Unbounded 999-Row Query in Sitemap

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/app/sitemap.ts` | 26 | `getArticles(undefined, 1, 999)` — requests up to 999 articles with `pageSize=999` |

**Finding**: The sitemap function requests **all articles in one unbounded query** (page size 999). For a news site publishing daily, this query retrieves more rows than needed. Supabase REST API charges per row returned, and the server-side function loads all rows into memory. If the article count exceeds 999, the sitemap silently uses only the first 999 items.

---

### 🔶 IMP-4: Scroll Event Listeners Without Throttle

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/components/BackToTop.tsx` | 18 | `window.addEventListener("scroll", toggleVisibility)` — fires `setVisible()` on every scroll pixel |
| `src/components/SiteHeader.tsx` | 22–23 | `window.addEventListener("scroll", handleScroll)` — fires `setScrolled()` on every scroll pixel |

**Finding**: Both `BackToTop` and `SiteHeader` attach raw scroll listeners that update React state on every scroll event. Scroll events fire at ~60 events/second during fast scrolling. Each `setState` call triggers a re-render of the component subtree. While React batches state updates, the `setState` calls themselves are not free.

**Symptom**: Both components handle this decently for now (small state, no expensive re-renders downstream), but this pattern will become a bottleneck if more logic is added to these scroll handlers.

---

### 🔶 IMP-5: No React.memo on ArticleCard — Unnecessary Re-renders

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/components/ArticleCard.tsx` | 47 | `export default function ArticleCard(...)` — **no `React.memo()` wrapper** |
| `src/components/SidebarWidgets.tsx` | 8, 59, 96 | `NewsletterWidget`, `SocialFollowWidget`, `TrendingRailWidget` — **no `React.memo()`** |
| `src/components/Pagination.tsx` | 3 | No `React.memo()` — re-renders on every parent render |

**Finding**: `ArticleCard.tsx` is rendered 10–20+ times on the homepage (`HomePage.tsx` renders it in the hero section (1), spotlight (4), tab feed (up to 6), category sections (up to 16), editor's picks (up to 5)). Without `React.memo`, every state change in `HomePage` (e.g., the `activeTab` filter toggle) triggers a full re-render of all visible `ArticleCard` instances. Each instance recomputes `getRelativeTimestamp()`, `getCategoryBadgeClasses()`, and the entire JSX tree.

---

### 🔶 IMP-6: Multiple Sequential Supabase Queries on Article Page

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/app/article/[slug]/page.tsx` | 68 | `await getArticleById(decodedSlug)` — first Supabase query |
| `src/app/article/[slug]/page.tsx` | 74 | `await getArticles(article.category.id, 1, 4)` — second Supabase query (sequential, not parallel) |
| `src/app/category/[slug]/page.tsx` | 38–39 | Two sequential queries: `getArticles()` + `getArticlesCount()` |

**Finding**: The article detail page fires two sequential Supabase queries. These could be parallelized with `Promise.all()`. Similarly, the category page fires `getArticles()` and `getArticlesCount()` sequentially when they could run concurrently. The Supabase client uses `cache: 'no-store'` globally, so there's no automatic deduplication.

---

## Nice-to-Have

### 🔷 NTH-1: Hardcoded Default Supabase Credentials in Source

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/lib/supabase.ts` | 3 | `const DEFAULT_URL = 'https://msypsrswdlvamjzgqgpg.supabase.co'` |
| `src/lib/supabase.ts` | 4 | `const DEFAULT_ANON_KEY = 'eyJhbG...lv44'` (truncated — full key in source) |

**Finding**: The Supabase project reference and anonymous API key are **hardcoded as fallback defaults** in the client. While the `supabase-js` anon key is designed to be public (the Supabase project REST API requires it), hardcoding it means:
- Anyone reading the source code silently uses your Supabase project — even if Vercel env vars are misconfigured
- The fallback URL is always used when env vars are `undefined` or `null` (the code has explicit checks for these string values)
- If the Supabase project ever rotates keys, the hardcoded fallback becomes invalid and silently breaks the app

---

### 🔷 NTH-2: Regular `<img>` Tag in Author Page — No Next.js Optimization

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/app/author/[slug]/page.tsx` | 43–48 | Uses `<img src={author.avatarUrl} ... width={80} height={80} />` instead of `next/image` |

**Finding**: The author avatar uses a plain `<img>` tag instead of Next.js `Image` component. This loses automatic image optimization (WebP conversion, lazy loading, responsive sizes). The `next.config.ts` does not have `dicebear.com` in `remotePatterns`, which would cause a 500 error if `next/image` were used — but the fix is to either add the remote pattern or use a different avatar source.

---

### 🔷 NTH-3: Orphaned `app_backup/` Directory and `Idea.md`/`project.md` Duplicates

| File | Line(s) | Evidence |
|------|---------|----------|
| `app_backup/layout.tsx` | — | Older version of layout — stale copy that could confuse developers |
| `app_backup/page.tsx` | — | Older version of homepage — stale copy |
| `Idea.md` | entire | Contains identical content to `project.md` — duplicate, could drift out of sync |
| `project.md` | entire | Primary architecture doc — same content |

**Finding**: The project has duplicate architecture documents (`Idea.md` and `project.md` are identical) and a stale `app_backup/` directory. These artifacts increase maintenance burden and could cause confusion about which document is authoritative.

---

### 🔷 NTH-4: No CORS / Security Headers Configuration

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/app/layout.tsx` | 9–37 | `metadata` object includes no security headers |
| `next.config.ts` | 1–27 | No `headers()` async function for CSP, X-Frame-Options, X-Content-Type-Options, etc. |
| (entire codebase) | all | Searched for `Content-Security-Policy`, `CSP`, `X-Frame`, `X-Content` — **zero matches** |

**Finding**: No Content Security Policy, no `X-Frame-Options` (clickjacking protection), no `X-Content-Type-Options` (MIME sniffing prevention). While Next.js App Router applies some default headers, explicit security headers are recommended for production deployment.

---

### 🔷 NTH-5: Social Link `href="#"` — Dead Anchors With No Fallback

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/components/SiteHeader.tsx` | 53, 56, 59, 62 | `<a href="#">` for Facebook, Twitter/X, Instagram, YouTube |
| `src/components/SidebarWidgets.tsx` | 79 | `<a href="#">` for social follow links |
| `src/components/Footer.tsx` | 124, 129, 134 | `<a href="https://facebook.com" ... target="_blank">` — these have real URLs |

**Finding**: Social media links in `SiteHeader.tsx` and `SidebarWidgets.tsx` use `href="#"` — they are non-functional anchors. The `Footer.tsx` version uses real URLs correctly. This is a UX issue (non-functional buttons) and a very low-priority security concern (empty `href` resets to current page).

---

### 🔷 NTH-6: No Zod Validation or Input Schema for API Data

| File | Line(s) | Evidence |
|------|---------|----------|
| `src/lib/articles.ts` | 3–11 | `Article` interface assumes DB shape — no runtime validation |
| (entire codebase) | all | Searched for `zod`, `.parse`, `.safeParse` — **zero matches** (except in `node_modules/`) |

**Finding**: Despite `zod` being installed as a dependency (present in `node_modules/`), there is zero runtime validation of data coming from the Supabase API. The `Article` TypeScript interface (`articles.ts:3–11`) trusts the database response shape implicitly. If the Supabase schema changes or data corruption occurs, there is no runtime safety net.

---

## Summary Table

| # | Area | Severity | Category | Concrete Evidence |
|---|------|----------|----------|-------------------|
| CRIT-1 | RBAC Auth | **Critical** | Security | Zero auth/roles; `persistSession:false`; `bcryptjs` unused |
| CRIT-2 | Rate Limiting | **Critical** | Security | No middleware, throttling, or rate-limit package anywhere |
| CRIT-3 | Comment Validation | **Critical** | Security | Client-only state; no server validation when DB is connected |
| CRIT-4 | CSS Variables | **Critical** | Bug | 5 undefined `var(...)` references rendering as fallback |
| IMP-1 | ILIKE Search | **Important** | Performance | Full-table scan per search; documented FTS index not created |
| IMP-2 | MutationObserver | **Important** | Performance | `prefetchAll()` on every DOM mutation; no debounce |
| IMP-3 | Sitemap Query | **Important** | Performance | `getArticles(..., 999)` — unbounded rows retrieval |
| IMP-4 | Scroll Listeners | **Important** | Performance | Raw scroll listeners on BackToTop + SiteHeader; no throttle |
| IMP-5 | React.memo | **Important** | Performance | `ArticleCard` (20+ instances) and 3 sidebar widgets not memoized |
| IMP-6 | Sequential Queries | **Important** | Performance | Article page and category page run sequential DB queries |
| NTH-1 | Hardcoded Credentials | **Nice-to-Have** | Security | Default Supabase URL + key in source |
| NTH-2 | `<img>` tag | **Nice-to-Have** | Optimization | Author page uses `<img>` not `next/image` |
| NTH-3 | Stale files | **Nice-to-Have** | Hygiene | `app_backup/` and `Idea.md`/`project.md` duplicates |
| NTH-4 | Security Headers | **Nice-to-Have** | Security | No CSP, no X-Frame-Options, no X-Content-Type-Options |
| NTH-5 | Dead social links | **Nice-to-Have** | UX | `href="#"` on SiteHeader/SidebarWidgets social icons |
| NTH-6 | Zod validation | **Nice-to-Have** | Resilience | `zod` installed but unused for runtime DB data validation |
