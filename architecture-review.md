# TANGENT (ট্যানজেন্ট) — Architecture Review

> **Review date**: 2026-07-29  
> **Scope**: Blueprint vs implementation match, data model soundness, rendering/caching strategy, API/auth design, scalability risks  
> **Method**: READ-ONLY codebase inspection — no changes made  
> **Files reviewed**: 30 source files under `src/`, plus `next.config.ts`, `package.json`, `project.md`, `tailwind.config.ts`, `tsconfig.json`

---

## Summary

The codebase is a well-structured Next.js 16.2.10 App Router project with strong alignment between `project.md` and implementation for directory layout, component names, and styling approach. However, several **critical issues** were found: the ISR/caching triple-config (`force-dynamic` + `revalidate` + `no-store`) renders ISR entirely non-functional; the data model has no Author, Tag, or Comment tables despite being used in the UI; search uses sequential table scans; `bcryptjs` is an unused dependency; the `robots.ts` disallows a non-existent `/api/` path; and the comment/newsletter systems are entirely client-side in-memory with no persistence.

---

## Critical

### C1. ISR Is Not Actually Working (Triple-Config Conflict)

- **Files**: `src/app/page.tsx:4-5`, `src/app/article/[slug]/page.tsx:10-11`, `src/app/category/[slug]/page.tsx:6-7`, `src/app/author/[slug]/page.tsx:7-8`, `src/lib/supabase.ts:42`
- **Evidence**: Every server page exports both:
  ```ts
  export const revalidate = 60;      // page.tsx:4, article/[slug]/page.tsx:10, etc.
  export const dynamic = "force-dynamic";  // page.tsx:5, article/[slug]/page.tsx:11, etc.
  ```
  And the Supabase client overrides fetch caching globally:
  ```ts
  // src/lib/supabase.ts:42
  fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  ```
- **Impact**: In Next.js App Router, `force-dynamic` overrides `revalidate` completely — the route is always rendered dynamically, ISR never engages. The `cache: 'no-store'` on all Supabase fetches further prevents any Data Cache layer from working. Every page visit hits Supabase directly. The `revalidate = 60` export is therefore **dead code** — it never takes effect.
- **project.md claim** (§4.A): "To ensure news updates render on demand rather than serving empty static build artifacts" — The intent is understood, but the triple-config means the site has **zero caching**. On Vercel Serverless, every request spins up a function and fetches from Supabase.

### C2. No Author, Tag, or Comment Database Tables

- **Files**: `src/lib/articles.ts:36-39` (`FrontendArticle.author` interface), `src/lib/articles.ts:52-63` (hardcoded tags array), `src/components/CommentSection.tsx:6-12` (in-memory comment state)
- **Evidence**: The `FrontendArticle` type requires `author: { name, slug, bio, avatarUrl }` and `tags: Tag[]`, but:
  - `src/lib/supabase.ts` only connects to a single `articles` table (no `authors`, `tags`, or `comments` tables)
  - `mapArticle()` at line 96 hardcodes: `author: { name: 'বাংলানিউজ ডেস্ক', slug: 'desk', bio: '', avatarUrl: '' }`
  - `mapArticle()` at line 97 hardcodes: `tags: []`
  - CommentSection stores comments in `useState<Comment[]>` with hardcoded seed data (lines 15-30) — nothing is persisted
- **Impact**: The Author page (`src/app/author/[slug]/page.tsx:23-25`) only supports slug `"desk"` and returns 404 for any other author. Tags are always empty in the UI (comment in `article/[slug]/page.tsx:179` is dead code). User-submitted comments are lost on page refresh. The data model promises richness (`author`, `tags`) that the database schema cannot back.
- **project.md claim** (§5): Database schema only shows a single `articles` table — this matches the code, but the `FrontendArticle` interface in `articles.ts:26-39` implies a relational model that doesn't exist in the database.

### C3. Search Is a Full Table Scan (No Index)

- **File**: `src/lib/articles.ts:217-237`
- **Evidence**:
  ```ts
  // src/lib/articles.ts:224
  .ilike('title', `%${query}%`)
  ```
  This uses PostgreSQL `ILIKE` with a leading `%` wildcard, which **cannot use B-tree indexes**. Every search request scans the entire `articles` table sequentially.
- **Impact**: As article count grows (10K+, 100K+), search latency degrades linearly. The code itself documents this problem in a comment (lines 199-215) recommending a GIN `to_tsvector` index, but the actual implementation still uses `ILIKE`.
- **project.md claim**: No mention of search architecture or full-text search — this is a missing requirement.

### C4. Sitemap Fetches All Articles Without Limit

- **File**: `src/app/sitemap.ts:26`
- **Evidence**:
  ```ts
  const articles = await getArticles(undefined, 1, 999);
  ```
  This calls `supabase.from('articles').select(...).range(0, 998)` — requesting up to 999 rows on every sitemap generation.
- **Impact**: On Vercel Serverless, this is a cold-start DB query that could time out or be expensive as the article count grows. The sitemap is fetched by search engine crawlers frequently. Additionally, `getArticles` only selects `id, title, category, image_url, created_at` (line 108) but the sitemap only needs `slug` and `publishedAt` — the extra fields are wasted bandwidth.

---

## Important

### I1. Missing `content` Field in List Queries → Empty Excerpts Everywhere

- **Files**: `src/lib/articles.ts:90` (excerpt generation), `src/lib/articles.ts:108` (getArticles select list), `src/lib/articles.ts:161-163` (getLatestArticles select list), `src/lib/articles.ts:221-223` (searchArticles select list)
- **Evidence**:
  - `getArticles()` selects: `'id, title, category, image_url, created_at'` — **no `content`**
  - `getLatestArticles()` selects: `'id, title, category, image_url, created_at'` — **no `content`**
  - `searchArticles()` selects: `'id, title, category, image_url, created_at'` — **no `content`**
  - `mapArticle()` at line 90: `excerpt: article.content ? article.content.slice(0, 160) : ''`
  - `mapArticle()` at line 91: `body: article.content ? article.content.split('\n').filter(Boolean) : []`
- **Impact**: Since `content` is never fetched in list queries, `article.content` is always `undefined`. This means:
  - All `ArticleCard` instances (homepage, categories, search, author) render with **empty excerpts**
  - Article body is always `[]` on list pages
  - RSS feed descriptions are always empty (`row.excerpt` → `''`)
  - Only the article detail page at `article/[slug]/page.tsx` works correctly (it uses `getArticleById` which selects `*`)
- **Note**: The code doesn't crash because of the ternary fallbacks — but the UX is broken silently.

### I2. `revalidate = 60` Export in `articles.ts` Is Dead Code

- **File**: `src/lib/articles.ts:102`
- **Evidence**:
  ```ts
  export const revalidate = 60;
  ```
  This is inside `/src/lib/articles.ts`, not a page/layout/route file. Next.js only uses `revalidate` when exported from Route Segment Config (i.e., `page.tsx`, `layout.tsx`, `route.ts`). Exporting it from a library module has **no effect** on Next.js caching behavior.
- **Impact**: Misleading — a reader would assume ISR is configured for these data functions, but this export is silently ignored.

### I3. Slug Is the Database ID — No SEO-Friendly URLs

- **Files**: `src/lib/articles.ts:87-88` (`mapArticle` slug generation), `project.md §5` (database schema)
- **Evidence**:
  ```ts
  // src/lib/articles.ts:87-88
  slug: String(article.id),
  ```
  The `Article` interface (line 3) has `id: string | number`, and the `project.md §5` schema shows `id` as `uuid / text` — so URLs look like `/article/1` or `/article/<uuid>`.
- **Impact**: For a Bengali news site, SEO-friendly URLs like `/article/বাংলাদেশ-অর্থনীতি-২০২৪` are standard. Numeric or UUID-based URLs harm search ranking and user experience. There is no `slug` column in the database schema at all.
- **project.md claim** (§5): No `slug` column exists in the schema definition — this is a gap between the schema design and standard news-site SEO requirements.

### I4. Category Page Executes Two Sequential Queries

- **File**: `src/app/category/[slug]/page.tsx:38-39`
- **Evidence**:
  ```ts
  const articles = await getArticles(dbCategory, currentPage, ITEMS_PER_PAGE);
  const totalArticles = await getArticlesCount(dbCategory);
  ```
  These are two separate sequential Supabase queries on every category page load. `getArticlesCount` uses `head: true` (lightweight count), but the pattern still doubles database round-trips.
- **Impact**: On high-traffic categories (e.g., National/Politics during breaking news), each page load requires 2 DB queries. With `force-dynamic`, there's no caching to amortize this cost.

### I5. HomePage Client-Side Tab Filtering Over Static Data

- **File**: `src/components/HomePage.tsx:24-27`
- **Evidence**:
  ```ts
  // HomePage receives 20 articles via getLatestArticles(20)
  const tabFilteredArticles = activeTab === "all"
    ? articles.slice(0, 6)
    : articles.filter((a) => a.category.id === activeTab).slice(0, 6);
  ```
  The tab filter (Politics, Economics, Sports, Tech) operates on the **same 20 articles fetched for the homepage**. It does NOT fetch new data from Supabase — it simply filters what's already loaded.
- **Impact**: If no articles of a given category exist in the initial 20, that tab shows empty results even if hundreds of articles of that category exist in the database. The tab buttons give a false impression of server-side filtering.

### I6. `bcryptjs` in `package.json` but Never Used

- **File**: `package.json:13`
- **Evidence**:
  ```json
  "bcryptjs": "^3.0.3"
  ```
  And:
  ```bash
  grep -rn "bcrypt\|hash\|password" src/ --include="*.ts" --include="*.tsx"
  # No matches for bcrypt, hash, or password usage
  ```
- **Impact**: 6.3KB+ of unnecessary bundle dependency included in the production build. Also `@types/bcryptjs` is a devDependency for no reason.
- **Note**: Combined with the Login/Subscribe buttons in SiteHeader (lines 79-84 of `SiteHeader.tsx`) that have no navigation handlers or auth logic, it appears auth was planned but never implemented.

### I7. `robots.ts` Disallows a Non-Existent `/api/` Path

- **File**: `src/app/robots.ts:8`
- **Evidence**:
  ```ts
  disallow: ['/api/', '/feed.xml'],
  ```
  There is **no `src/app/api/` directory** in the project. The `/api/` route does not exist.
- **Impact**: The `disallow` is harmless but misleading. More importantly, the RSS feed is also disallowed (`/feed.xml`), which is unusual for a news site — RSS is typically promoted to search engines, not hidden.

---

## Nice-to-Have

### N1. No Database Indexes on `created_at` or `category`

- **File**: `src/lib/articles.ts:114` (order by `created_at`), `src/lib/articles.ts:111` (ilike filter on `category`)
- **Evidence**: All queries order by `created_at desc` and filter by `category` via `ilike`. Without database indexes on `articles.created_at` and `articles.category`, these queries degrade as the table grows. The `project.md §5` schema does not define any indexes.
- **Recommendation**: Add composite index `(category, created_at desc)` and a simple index on `created_at desc`.

### N2. `isPlaceholder` Flag Is Hardcoded to `false`

- **File**: `src/lib/supabase.ts:35`
- **Evidence**:
  ```ts
  export const isPlaceholder = false;
  ```
  This flag gates all data-fetching functions (e.g., `if (isPlaceholder) return []`). Since it's hardcoded to `false`, the fallback code path is dead and serves no purpose. If it were intended for development/offline mode, it should be driven by an environment variable.

### N3. Author Page Only Supports One Hardcoded Author

- **File**: `src/app/author/[slug]/page.tsx:23-31`
- **Evidence**:
  ```ts
  if (decodedSlug !== "desk") {
    notFound();
  }
  const author = {
    name: "বাংলানিউজ ডেস্ক",
    slug: "desk",
    ...
  };
  ```
  The author route `/author/:slug` only renders for `slug=desk`. Any other author slug returns a 404. The avatar URL (`https://api.dicebear.com/...`) is also a third-party dependency that will break if DiceBear changes their API.

### N4. Newsletter and Social Follow Are Client-Side Only

- **Files**: `src/components/SidebarWidgets.tsx:12-15` (NewsletterWidget), `src/components/SidebarWidgets.tsx:60-65` (SocialFollowWidget)
- **Evidence**:
  - `NewsletterWidget` stores subscription state in `useState` — on refresh, it's gone. No API call, no database persistence.
  - `SocialFollowWidget` has hardcoded follower counts (`৪৫কে`, `২৮কে`, etc.) — these are static placeholder numbers.
  - Social links point to `"#"` (no real URLs).

### N5. Global `fetch` Override in Supabase Client Is Broad

- **File**: `src/lib/supabase.ts:42`
- **Evidence**:
  ```ts
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
  ```
  This overrides the global fetch for **every request the Supabase client makes**, not just data queries. This includes auth requests, storage requests, etc. — all bypass the Next.js Data Cache.

### N6. `force-dynamic` Not Exported on Search Page or RSS Route

- **Files**: `src/app/search/page.tsx` (no `force-dynamic`), `src/app/feed.xml/route.ts` (no `force-dynamic`)
- **Evidence**: Both routes lack the `force-dynamic` export that all other server pages have. While the App Router defaults to dynamic for server components that use `cookies()`, `headers()`, or `searchParams`, the explicit pattern is inconsistent. The RSS route has `Cache-Control: public, max-age=3600` in its response headers (line 41), which is the only actual cache header in the project.
- **Impact**: Minor inconsistency — the pattern expected by `project.md` (§4.A: "Preserve Dynamic Flags") is not uniformly applied.

### N7. Gravatar/DiceBear External Dependency for Author Avatar

- **File**: `src/app/author/[slug]/page.tsx:31`
- **Evidence**:
  ```ts
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=desk",
  ```
  Author avatars depend on DiceBear's API. If DiceBear changes their URL scheme or goes offline, the author page shows a broken image. There is no fallback in the `<img>` tag (no `onError` handler).

### N8. CommentSection `articleId` Prop Is Never Used for Backend Logic

- **File**: `src/components/CommentSection.tsx:14, 43`
- **Evidence**:
  ```ts
  export default function CommentSection({ articleId }: { articleId: string }) {
    const [comments, setComments] = useState<Comment[]>([...]);
  ```
  The `articleId` prop is stored in each comment object but never sent to any backend. It's only used in the `newComment` object at line 43. Since there's no persistence layer, comments from different articles are never actually isolated — they just live in this component's state.

### N9. No Image Optimization Configuration for External Sources

- **File**: `next.config.ts:14-26`
- **Evidence**: Only two remote pattern entries exist: Supabase storage and images.pexels.com. No `formats`, `deviceSizes`, `imageSizes`, or `minimumCacheTTL` settings are configured. The image quality defaults to Next.js's built-in 75%.

### N10. `formatDateShort` Is a Duplicate of `formatDate`

- **File**: `src/lib/utils.ts:36-38`
- **Evidence**:
  ```ts
  export function formatDateShort(dateStr: string): string {
    return formatDate(dateStr);
  }
  ```
  This function is an exact passthrough to `formatDate` with no additional logic — it's unused anywhere in the codebase. Either it should be removed or given distinct behavior (e.g., omit year).

---

## File-by-File Finding Index

| File | Lines | Issues |
|------|-------|--------|
| `src/app/page.tsx` | 4-5 | C1 — `force-dynamic` + `revalidate` conflict |
| `src/app/article/[slug]/page.tsx` | 10-11, 74 | C1, I5 (related articles query) |
| `src/app/category/[slug]/page.tsx` | 6-7, 38-39 | C1, I4 |
| `src/app/author/[slug]/page.tsx` | 7-8, 23-31 | C1, N3 |
| `src/app/search/page.tsx` | - | N6 (missing `force-dynamic` inconsistency) |
| `src/app/sitemap.ts` | 26 | C4 |
| `src/app/feed.xml/route.ts` | 8, 40-41 | I1 (empty excerpt), N6 |
| `src/app/robots.ts` | 8 | I7 |
| `src/lib/supabase.ts` | 35, 42 | N2, C1, N5 |
| `src/lib/articles.ts` | 3-11, 26-39, 87-97, 102, 108, 161-163, 221-224 | C2, I1, I2, I3 |
| `src/components/CommentSection.tsx` | 6-12, 14, 31-32, 36-52 | C2, N8 |
| `src/components/HomePage.tsx` | 24-27 | I5 |
| `src/components/SidebarWidgets.tsx` | 8-15, 59-65, 96-133 | N4 |
| `src/components/SiteHeader.tsx` | 79-84 | I6 (Login/Subscribe with no auth) |
| `package.json` | 13, 20 | I6 |
| `next.config.ts` | 14-26 | N9 |
| `src/lib/utils.ts` | 36-38 | N10 |

---

## Recommendations (Review Only — No Fixes Applied)

1. **Rendering strategy**: Choose one caching approach (ISR with `revalidate` only, or fully dynamic with edge caching/CDN). The current triple-config negates all caching.
2. **Database schema**: Add `authors`, `tags`, `article_tags` junction, and `comments` tables to match the `FrontendArticle` interface.
3. **Search**: Implement the GIN `to_tsvector` index as documented in the code's own comment, or switch to Supabase's full-text search.
4. **Sitemap**: Limit to top N articles (e.g., 500), and select only required fields (`slug`, `published_at`).
5. **Excerpts**: Add `content` to list query select lists, or compute excerpts at write-time and store in a separate column.
6. **Remove dead code**: `bcryptjs`, `revalidate` from `articles.ts`, `formatDateShort`, `isPlaceholder`, unused `tailwind.config.ts` v3-style config.
