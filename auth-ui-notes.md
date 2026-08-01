# TANGENT CMS — Auth UI Notes (Phase 2)

Date: 2026-08-01 · Scope: Registration & Login UI for the CMS route group.

## Files Created

| File | Purpose |
|---|---|
| `src/lib/useAuth.ts` | Client-side auth hook: React Context + `AuthProvider` + `useAuth()`. Persists session to `localStorage` under `tangent_auth`. |
| `src/app/(cms)/layout.tsx` | Route-group layout for `/register`, `/login` (and future CMS pages). Wraps children in `AuthProvider`. |
| `src/app/(cms)/register/page.tsx` | Registration form (`/register`) with inline validation, password strength meter, spinner states, success panel. |
| `src/app/(cms)/login/page.tsx` | Login form (`/login`) with inline validation, spinner states, "Forgot password?" stub, redirect to `/dashboard`. |
| `auth-ui-notes.md` | This document. |

No existing public-facing component or page was modified.

## The Auth Flow

```
register ──► success panel ──► /login ──► token stored in localStorage ──► router.push("/dashboard")
```

1. **Register** (`POST /api/auth/register`, body `{ email, password, display_name }`)
   - Client validates first (email format, password ≥ 8 chars, confirm match, display name ≤ 100 chars).
   - On 201, `register()` returns `{ success: true }` but does **not** auto-login and does **not** persist any token — the user is sent to the login page.
   - Server-side, Supabase may require email confirmation; the success panel mentions this.
2. **Login** (`POST /api/auth/login`, body `{ email, password }`)
   - On 200, `login()` persists `{ token: session.access_token, user: { id, email, role } }` to `localStorage["tangent_auth"]` and updates context state.
   - The form then does `router.push("/dashboard")` (dashboard page itself is a later Phase 2 deliverable — it will 404 until built).
3. **Session restore** — `AuthProvider` reads `localStorage["tangent_auth"]` on mount; `isLoggedIn` is derived from the presence of a token.
4. **Protected API calls** — CMS APIs receive the token as `Authorization: Bearer <access_token>`. A future authenticated fetch wrapper should read it from `useAuth().token`.
5. **Logout** (`POST /api/auth/logout`) — stateless server ack; `logout()` clears localStorage and context state (client-side discard is the real logout).

## Design Decisions

### Layout
- CMS pages live in a **route group** `src/app/(cms)/` — the URL stays `/register` / `/login` while the group carries its own layout + provider.
- The CMS layout only wraps children in `AuthProvider`. **ThemeProvider is not re-wrapped** — the root layout already provides it, and nested layouts cannot render their own `<html>`/`<body>` (Next.js restriction). Consequence: the document `lang="bn"` from the root layout also applies to CMS pages; the CMS UI is authored in English (admin tool, not reading surface). If a distinct `lang="en"` is ever needed, it requires a separate root layout for the route group (follow-up).
- Pages render inside the existing root layout (header/footer visible) — no public components were altered to hide them.

### Color / Theme
- CTA buttons: `bg-accent-primary` (`#e11d48`) → `hover:bg-accent-hover` (`#be123c`), matching the site's signature red.
- Card: `bg-white dark:bg-[#0f172a]`, border `slate-200 dark:border-slate-800`, radius `rounded-2xl`, subtle `shadow-sm` — mirrors `SiteHeader`'s dark surface (`#0f172a`).
- Page background inherits root body styles (`slate-50` / `#0b0f19`); the wrapper adds vertical centering.
- Signature **cobalt rule** (`hr.cobalt-rule`) tops each card for brand continuity.
- Inputs reuse the existing `.admin-input` class (already dark-mode aware); error borders are applied via inline `borderColor: var(--color-tangent-red)` because Tailwind utilities cannot override the unlayered `.admin-input` rule.
- Inline field errors: `text-red-600 dark:text-red-400` with a small warning icon. Server errors: soft red banner (`red-50` / `red-950/40`).

### Typography
- Brand wordmark + headings: Inter via `font-sans` / `font-display` (UI surface — not a reading surface, so no Merriweather body copy).
- Headings `font-extrabold tracking-tight`; labels `text-sm font-semibold`; errors/help `text-xs`.

### Animation
- Cards use the existing `animate-fade-in` class (fadeIn 0.3s ease-out) — already motion-safe under `prefers-reduced-motion` via globals.css.
- Submit buttons show an `animate-spin` SVG spinner + disabled state while requests are in flight.
- Password strength bars use `transition-colors duration-300`.

### Validation approach
- **Client-side, inline, before submit**: email regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), password ≥ 8 chars, confirm-password exact match, display name required / ≤ 100 chars. Errors render under each field (red text), not just a toast.
- Field errors clear as the user types; a full re-validation runs on submit.
- Password strength: score = length (≥8, ≥12) + variety (mixed case, digit, symbol) → **weak / fair / strong** with a 3-segment bar (red / amber / emerald). Indicator only appears once a password is typed.
- **Server errors** are parsed from the JSON body (`error` field) with per-endpoint fallbacks (e.g. login → "Invalid email or password.", network failure → "Network error — please try again.").

### Accessibility
- `<label htmlFor>` ↔ input `id` pairs everywhere; `aria-invalid` + `aria-describedby` point at inline error text.
- Error banners use `role="alert"`; the strength meter uses `aria-live="polite"`.
- Correct `autoComplete` hints (`email`, `new-password` on register, `current-password` on login, `name` for display name).
- Buttons show visible spinner + disabled state; `noValidate` keeps native browser bubbles out so our inline errors are the single source of truth.

## Follow-ups

- [ ] **Password reset wiring** — "Forgot password?" on `/login` is a `#` stub (click is prevented). Supabase has built-in reset (`auth.resetPasswordForEmail` + recovery flow); needs a `/forgot-password` page and route. Task owner: backend.
- [ ] **Email confirmation UX** — if Supabase "Confirm email" is enabled, register succeeds but login fails until the link is clicked. Consider surfacing a "check your inbox" state driven by the API response, and disabling confirm-email in dev.
- [ ] **Dashboard route** — `/login` redirects to `/dashboard`, which does not exist yet (404). Build the dashboard behind the `(cms)` layout; gate it with `useAuth().isLoggedIn` + a redirect to `/login` when logged out.
- [ ] **Authenticated fetch helper** — centralize `Authorization: Bearer <token>` injection for CMS API calls (e.g. `src/lib/apiClient.ts`) using `useAuth().token`.
- [ ] **Token expiry / refresh** — `expires_in` is returned but unused; plan silent refresh with `refresh_token` before the dashboard ships.
- [ ] **Rate limiting UX** — register/login are limited to 5 req/min/IP (429s already surface as inline server errors; consider a countdown hint).
- [ ] **`lang` attribute** — CMS route group currently inherits `lang="bn"` from the root layout; a separate root layout per route group could set `lang="en"` if needed.
- [ ] **Logout UI** — `useAuth().logout()` is implemented but no button in the header/dashboard exists yet.
