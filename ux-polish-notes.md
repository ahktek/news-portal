# TANGENT CMS — UX Polish Notes (Phase 3)

**Date:** 2026-08-01 · **Scope:** Loading states, toasts, accessibility, mobile responsiveness, modals, error messaging

---

## New Components Created

| Component | Purpose |
|---|---|
| `src/components/cms/Toast.tsx` | Pub/sub toast system — `toast.success()`, `toast.warning()`, `toast.error()`. Fixed bottom-right viewport, auto-dismiss (4s/6s), per-item dismiss, dark mode, `role="status"/"alert"`. |
| `src/components/cms/ConfirmDialog.tsx` | Accessible modal replacing `window.confirm()`. Focus trap (Tab wrap), Escape + backdrop-click close, focus restoration, body scroll lock, dark mode, `confirmDisabled` prop. |
| `src/components/cms/friendlyError.ts` | Maps technical error strings to user-friendly messages. Fallback heuristic keeps raw server errors hidden. |

---

## Changes by File

### `dashboard/page.tsx`
- **Before:** Pulse animation rows for loading, `window.confirm()` for archive
- **After:** Card-matching `ArticleListSkeleton` (image placeholder, title bar, metadata, action bars, dark variants); `ConfirmDialog` modal for archive; amber "Article archived" toast; green/red toasts on save; cards stack vertically on mobile (full-width thumbnails + buttons); empty state gets pencil icon; filter tabs get `role="group"`

### `ArticleEditor.tsx`
- **Before:** Inline "✓ Saved" text, no skeleton, keyboard gaps
- **After:** `ArticleEditorSkeleton` exported and wired into edit page; toasts replace inline save/error messages; title scales down on mobile; toolbar wraps + `role="toolbar"` + `aria-pressed` + `aria-label`; upload label as keyboard-reachable `role="button"`; editor body gets `aria-label`; friendly error mapping

### `dashboard/layout.tsx`
- **Before:** Basic hamburger toggle
- **After:** `<ToastViewport />` mounted; mobile drawer: `aria-controls`, Escape-to-close with focus return, focus moved into drawer on open

### `login/page.tsx`
- **Before:** Tab order: email → password → submit → forgot-password
- **After:** Tab order: email → password → forgot-password → submit (link moved below input)

### `register/page.tsx`
- **After:** Success heading focusable (`tabIndex={-1}`) with focus moved to it on success for screen readers

### `dashboard/articles/[id]/edit/page.tsx`
- **After:** Uses `ArticleEditorSkeleton` during load; friendly 404/403 messages; polished error state with icon

### `globals.css`
- **Added:** `.dark *:focus-visible` brighter focus ring, `toastIn`/`modalBackdropIn`/`modalCardIn` keyframes (all `prefers-reduced-motion` safe). Nothing removed.

---

## Accessibility Checklist

| Item | Status |
|---|---|
| Visible focus rings (light + dark) | ✓ |
| Logical tab order (forms, toolbar) | ✓ |
| Keyboard-reachable toolbar buttons | ✓ (`aria-pressed`, `aria-label`) |
| Keyboard-reachable upload trigger | ✓ (`role="button"`, Enter/Space) |
| Focus trap in archive modal | ✓ (Tab wrap, Escape close) |
| Focus restored after modal close | ✓ |
| Screen reader announcements (toasts) | ✓ (`role="status"/"alert"`) |
| Body scroll lock during modal | ✓ |
| Reduced-motion-safe animations | ✓ |

---

## Known Remaining Gaps

1. **ux-polish-notes.md was written post-hoc by orchestrator** — Agent H hit iteration limit before documentation step
2. **Pre-existing lint warnings** in `useAuth.tsx`, `ThemeProvider.tsx`, `CommentSection.tsx`, `supabase.ts` — pre-date Phase 3, not introduced
3. **Final build** passed after Agent H's changes (verified by orchestrator: 22 routes, zero errors)
