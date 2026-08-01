# TANGENT CMS — Editor UI Notes (Phase 2)

**Date:** 2026-08-01 · **Scope:** Article Editor component + new/edit page wrappers

---

## Files Created

| File | Purpose |
|---|---|
| `src/components/cms/ArticleEditor.tsx` | Shared rich-text editor component (~340 lines). Used by both new and edit pages. |
| `src/app/(cms)/dashboard/articles/new/page.tsx` | Thin wrapper — renders `<ArticleEditor />` (empty form). |
| `src/app/(cms)/dashboard/articles/[id]/edit/page.tsx` | Fetches article from API, renders `<ArticleEditor article={...} />`. Handles 404/403/auth-redirect. |

## Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `@tiptap/react` | ^3.29.2 | React bindings for Tiptap editor |
| `@tiptap/starter-kit` | ^3.29.2 | Bold, italic, headings, lists, blockquote |
| `@tiptap/extension-placeholder` | ^3.29.2 | Placeholder text in empty editor |
| `@tiptap/extension-image` | ^3.29.2 | Image node support in editor content |

Installed via `npm install`. No conflicts with existing packages. Only npm warnings for `allow-scripts` (sharp, unrs-resolver — native modules, expected for Tiptap).

---

## Design Decisions

### Editor Choice: Tiptap
Tiptap v3 was chosen over alternatives (Quill, Slate, Lexical) because:
- Headless React architecture — full control over toolbar styling to match TANGENT's design system
- TypeScript-first with excellent types for `useEditor`, `useEditorState`, `EditorContent`
- v3 auto-detects Next.js SSR and defaults `immediatelyRender: false` — no hydration mismatches
- Bengali Unicode works out of the box (no special config needed)
- Lightweight extension model — only StarterKit + Placeholder + Image installed

### Layout & Visual Design
- **Max width:** `max-w-4xl` — generous canvas for writing, not cramped
- **Title input:** `text-2xl sm:text-3xl font-serif font-bold` — matches the public site's headline typography
- **Editor area:** `prose prose-slate dark:prose-invert` — consistent with public article rendering
- **Toolbar:** Compact horizontal bar with accent-red active states, matching TANGENT's brand
- **Dark mode:** Every element has `dark:` variants — input borders, backgrounds, text, toolbar, status messages
- **Animation:** `animate-fade-in` on the editor container (reuses existing CSS keyframe)
- **Form controls:** Reuses `.admin-input` CSS class from globals.css for consistent input styling

### API Contract Used
- **Categories:** `GET /api/cms/categories` — fetched on mount, no auth needed
- **Create:** `POST /api/cms/articles` — sends `{ title, content, category_id, image_url }`, receives `{ article: { id, ... } }`
- **Update:** `PATCH /api/cms/articles/[id]` — partial update, `updated_at` auto-set server-side
- **Upload:** `POST /api/cms/upload` — multipart form, returns `{ url, path }`
- **Auth:** `Authorization: Bearer <token>` from `useAuth().token`

### Save Strategy
1. **Explicit save:** "Save Draft" button → `status: "draft"`; "Publish" button → `status: "published"` (server rejects if user is `author` — error surfaced inline)
2. **Autosave:** Every 30 seconds of idle time (timer resets on any change to title/content/category). Only triggers autosave if `dirtyRef` is true. Saves as draft. No visual feedback on autosave (silent).
3. **Unsaved changes guard:** `beforeunload` event prompts browser confirmation dialog if `dirtyRef` is true
4. **Success feedback:** Green "✓ Saved" text appears for 2 seconds after explicit save
5. **Error feedback:** Red error text near save buttons, parsed from API response

### Image Upload Flow
- Drag-and-drop zone OR click-to-browse button
- Validates file type client-side (`accept="image/jpeg,image/png,image/webp"`)
- Uploads to `POST /api/cms/upload` with Bearer token
- Shows thumbnail preview on success with "Remove" option
- Shows inline error on failure
- uploadError state cleared on retry

### Status Workflow
- **Draft:** Default for new articles. Only visible to the author in CMS.
- **Published:** Live on the public site. Only editors/admins can set this (authors get server-side 400 — error surfaced inline).
- **Archived:** Soft-delete via dashboard (not in editor). Editor only handles draft/published toggle.
- **Scheduling:** OUT OF SCOPE for Phase 2. Noted as follow-up.

### Type Strategy
- Defined a local `CmsArticle` interface in `ArticleEditor.tsx` rather than reusing the existing `Article` type from `src/lib/articles.ts`. The old `Article` type lacks `status`, `category_id`, `updated_at`, and `author_user_id` — using it would cause type errors against the CMS API responses.
- `useAuth().user` type has `display_name?: string` — the editor falls back to `user.email` when display_name is absent.

### Loading States
- **New article page:** Static (SSG) — renders immediately, no fetch needed
- **Edit article page:** Shows skeleton loader (animate-pulse) while fetching article, then renders editor
- **404:** "Article not found" with link back to dashboard
- **403:** "You don't have permission to edit this article" with link back
- **Unauthenticated:** Redirect to `/login`

---

## Build Verification

```
npm run build → ✓ Compiled successfully, zero TypeScript errors
Routes registered:
  ○ /dashboard/articles/new           (static)
  ƒ /dashboard/articles/[id]/edit     (dynamic)
  ○ /login                            (static)
  ○ /register                         (static)
```

---

## Follow-ups

1. **Scheduling:** Add optional publish date field. Requires API support (`scheduled_at` column + cron/edge-function to flip status).
2. **Password reset:** Wire the "Forgot password?" link to Supabase's built-in reset flow.
3. **Token refresh:** `useAuth` stores the refresh token but doesn't auto-refresh — add interceptor for 401 responses.
4. **Rich media embeds:** Extend Tiptap with embed support (YouTube, tweets, etc.).
5. **Collaborative editing:** Not in scope but Tiptap supports Y.js for real-time collab.
