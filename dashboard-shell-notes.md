# TANGENT CMS — Dashboard Shell & Article List Notes (Phase 2)

**Date:** 2026-08-01 · **Scope:** Dashboard route shell (layout + auth guard), article list page, and the SiteHeader "Dashboard" link. Integration layer on top of Agents D (auth UI) and E (editor) — nothing was rebuilt.

---

## Files Created / Modified

| File | Status | Purpose |
|---|---|---|
| `src/app/(cms)/dashboard/layout.tsx` | **created** | Dashboard shell: auth guard + responsive sidebar navigation + user block + logout. Wraps `/dashboard`, `/dashboard/articles/new`, `/dashboard/articles/[id]/edit`. |
| `src/app/(cms)/dashboard/page.tsx` | **created** | Article list: fetch + filter tabs + status/category badges + archive + pagination + empty/loading/error states. |
| `src/components/SiteHeader.tsx` | **modified (surgical)** | Added a conditional "Dashboard" link next to the লগইন button, shown only when `useAuth().isLoggedIn`. |
| `src/app/layout.tsx` | **modified (plumbing)** | `AuthProvider` moved from the `(cms)` route group up to the root layout so it wraps the whole app — see "Compatibility notes". |
| `src/app/(cms)/layout.tsx` | **modified (plumbing)** | Now a passthrough — `AuthProvider` was removed here because the root layout provides it app-wide. |
| `dashboard-shell-notes.md` | created | This document. |

No other public component was touched. The guardrail edit to `SiteHeader.tsx` is the only UI change to an existing shared component.

---

## Layout Decision: Sidebar (desktop) + Collapsing Top Bar (mobile)

A **persistent left sidebar** was chosen over a top navbar because:

- Authoring tools (WordPress admin, Sanity, Contentful) universally use sidebars — the mental model is "workspace", not "publication".
- A sidebar gives room for a **New Article** primary CTA, section nav, and a pinned user/logout block without competing with the public header above it.
- The dashboard renders inside the root layout, so the public `SiteHeader` (sticky, h-12 nav row) and `Footer` already frame the page. A top navbar would stack a third bar under the site header; a sidebar uses horizontal space instead.

Implementation:
- **Desktop (`lg+`)**: `lg:w-64` sidebar, `lg:sticky lg:top-12` (sticks below the public header's sticky nav row), `lg:h-[calc(100vh-3rem)]`, `overflow-y-auto`, `flex flex-col` with the user block pinned via `mt-auto`.
- **Mobile (`<lg`)**: sidebar hidden; a sticky top bar (brand + hamburger) plus a slide-down drawer (`animate-fade-in`) reusing the same nav JSX. The hamburger toggles `mobileNavOpen`.
- Active states use the editorial red: "My Articles" is active on `/dashboard` and any `/dashboard/articles/*` route (`text-accent-primary` + `bg-rose-50 dark:bg-rose-950/40`); "New Article" renders as a solid `bg-accent-primary hover:bg-accent-hover` button.
- Branding uses `font-serif` (per design tokens); all chrome is `font-sans`. Every element has `dark:` variants (`bg-white dark:bg-[#0f172a]`, `border-slate-200 dark:border-slate-800`).

## Route Protection Strategy

- The **layout** is the single guard for the whole `/dashboard` subtree: `useEffect` redirects to `/login` via `router.push` once `isLoading` settles and `isLoggedIn` is false; while `isLoading || !isLoggedIn` the layout renders only a spinner (nothing else mounts, so no unauthorized fetches).
- Defense in depth: the edit page (`articles/[id]/edit`) already had its own redirect; the new list page (`page.tsx`) also gates its fetch on `isLoggedIn`/`token`. Redundant guards are cheap and safe.
- On login success the existing `/login` page already pushes to `/dashboard`; the dashboard now exists, so that flow completes end-to-end.

## Article List Page (`page.tsx`)

- **Fetch**: `GET /api/cms/articles?page=N&pageSize=20` with `Authorization: Bearer <token>` from `useAuth()`. When `user.role` is `editor`/`admin`, `all=true` is appended so staff see every author's articles (server ignores it for authors — authors always get their own).
- **Filter tabs** (All | Draft | Published | Archived): **client-side** — they filter the currently loaded page's array, no extra API call. Switching tabs from a deep page resets to page 1 (one refetch) so the filter never presents an empty deep page.
- **Badges**: category colors reuse `getCategoryBadgeClasses(slug)` from `@/lib/utils`; the slug is resolved via a category map fetched once from the public `GET /api/cms/categories` (id → `{name, slug}`), falling back to the denormalized `article.category` string. Status badges: Draft = amber, Published = emerald, Archived = slate/gray.
- **Archive**: `window.confirm` → `DELETE /api/cms/articles/[id]` → on success **refetch** the current page so pagination totals and the Archived tab stay consistent. If the last item on a deep page is archived, the page auto-steps back one page.
- **Pagination**: Previous/Next buttons appear when `pagination.totalPages > 1`; they re-run the fetch with `?page=N`. While refetching, the existing list stays visible at 60% opacity with a "Loading…" label (no layout jump); first load shows 5 pulse-skeleton rows.
- **Empty states**: no articles at all → "You haven't written any articles yet" + "Write your first article" → `/dashboard/articles/new`; filtered-empty → "No {status} articles found" + "Show all articles".
- **Error state**: inline red banner with the server's `error` message + a Retry button that re-runs the fetch.
- **Types**: `import type { CmsArticle } from "@/components/cms/ArticleEditor"` — a type-only import, fully erased at compile time, so **Tiptap is never pulled into the list page's bundle** (verified below).
- **Dates**: `toLocaleDateString("en-US", { year, month: "short", day })` → e.g. "Aug 1, 2026".

## SiteHeader Change

- Added `import { useAuth } from "@/lib/useAuth"` and `const { isLoggedIn } = useAuth()`.
- When logged in, a **Dashboard** link renders immediately before the লগইন button in the top header row: `text-xs sm:text-sm font-extrabold`, `text-slate-600 dark:text-slate-300`, `hover:text-accent-primary`, `hidden sm:block` (matches the লগইন button's desktop-only pattern). When logged out, nothing renders and লগইন is untouched.
- SSR note: `isLoggedIn` is false during server render and the first client render (session is restored in an effect), so there is no hydration mismatch; the link appears after mount when a session exists.

## Compatibility Notes (important)

1. **`AuthProvider` moved to the root layout — required for the SiteHeader feature.** Previously `AuthProvider` lived only in `src/app/(cms)/layout.tsx`, so any `useAuth()` call on a *public* page would throw `useAuth must be used within an AuthProvider`. The task requires SiteHeader (rendered on every page) to call `useAuth()`, so the provider was lifted to `src/app/layout.tsx` (wrapping `SiteHeader` + main + footer inside `ThemeProvider`), and the now-redundant wrapper was removed from `(cms)/layout.tsx`. This is provider plumbing, not a UI change; `useAuth()` behavior is identical everywhere.
2. **Dashboard renders inside the public site frame.** The root layout's `SiteHeader`, `Footer`, announcement banner, and `PageTransition` overlay still wrap all CMS pages (the established architecture per `auth-ui-notes.md`). The sidebar's `sticky top-12` is tuned to sit below the header's sticky nav row. Hiding the public chrome on `/dashboard` would require a separate root layout for the route group — noted as a follow-up, out of scope.
3. **`user.display_name` is usually absent.** Login stores only `{ id, email, role }` (no `display_name`), so the shell's `user?.display_name || user?.email` falls back to email, and the editor does the same — consistent.
4. **Role read is client-side.** `?all=true` is decided from the stored `user.role`. The server re-validates (`requireAuth` + `isStaff`), so a stale/missing role simply means the author's own list — no data leak.
5. **Archived articles remain in the list.** The API returns every status, so archived items still appear under All/Archived tabs with a gray badge. "Archive" is a soft-delete; there is no unarchive path in the UI (matches the API contract).
6. **Code splitting**: the dashboard pages are separate route chunks from `/`. The list page's Tiptap-free status and the homepage bundle were verified in the build output (see Build Verification).

## Build Verification

```
npm run build → ✓ Compiled successfully, zero TypeScript errors
```

Route registration + per-route sizes from `next build` output are recorded in the final build log; Tiptap-bearing chunks are referenced only by the `/dashboard/articles/*` routes, and the homepage (`/`) chunk contains no Tiptap/ProseMirror code.

## Follow-ups

- [ ] Hide the public header/footer on `/dashboard` (separate root layout per route group) for a true app feel.
- [ ] Server-side status filtering (`?status=`) once the API grows one — the client-side tabs are a deliberate Phase 2 simplification.
- [ ] Unarchive action for archived articles.
- [ ] Unread/needs-review counts per status in the filter tabs (needs a status-count endpoint).
