# CMS Authentication Backend Notes

**Date:** 2026-08-01  
**Phase:** 1 of 3

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/supabase-admin.ts` | Server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS |
| `src/lib/auth.ts` | Auth helpers: `getSession()`, `requireAuth()`, `requireRole()`, `getUserRole()` |
| `src/lib/rate-limit.ts` | In-memory rate limiter (`Map`-based, 5 req/min/IP) |
| `src/app/api/auth/register/route.ts` | POST — create user via Supabase Auth + insert profile into `public.users` |
| `src/app/api/auth/login/route.ts` | POST — authenticate, return tokens + role |
| `src/app/api/auth/logout/route.ts` | POST — stateless acknowledgement |

## Files Modified

| File | Change |
|---|---|
| `src/lib/supabase.ts` | `persistSession: false` → `persistSession: true` (line 39) |

---

## Authentication Flow

### Registration (`POST /api/auth/register`)

```
Client → POST { email, password, display_name }
  → Rate limit check (5/min/IP)
  → Validate email format, password ≥8 chars, display_name present
  → supabaseAdmin.auth.signUp({ email, password, options: { email_confirm: true } })
  → INSERT INTO public.users (id, email, display_name, role='author')
  → 201 { success, user }
  
On profile insert failure: cleanup deletes the auth user to avoid orphans.
```

### Login (`POST /api/auth/login`)

```
Client → POST { email, password }
  → Rate limit check (5/min/IP)
  → supabaseAdmin.auth.signInWithPassword({ email, password })
  → SELECT role FROM public.users WHERE id = auth user id
  → 200 { success, session: { access_token, refresh_token, expires_in }, user: { id, email, role } }
```

### Authentication on Protected Routes

```
Client sends: Authorization: Bearer <access_token>
  → getSessionUser() extracts token, calls supabaseAdmin.auth.getUser(token)
  → getUserRole() queries public.users for the CMS role
  → Route handler calls requireAuth() or requireRole(['editor','admin'])
```

### Logout (`POST /api/auth/logout`)

Stateless — the client discards the token from storage. The endpoint returns `{ success: true }` for API consistency.

---

## Session Strategy

**Token-based (stateless).** The login endpoint returns JWT access + refresh tokens. The CMS client stores them (localStorage) and sends the access token via `Authorization: Bearer` on every API call. The server verifies the token via `supabaseAdmin.auth.getUser()` — no server-side session store needed.

This avoids:
- Cookie/SSR complexity (no `@supabase/ssr` dependency)
- Server-side session state
- Middleware interference with public routes

---

## Role-Based Access Control

Roles are stored in `public.users.role` (created by migration `002_cms_schema.sql`):

| Role | Permissions |
|---|---|
| `author` | Create own articles, edit own articles, upload images |
| `editor` | All of author + edit any article, manage categories |
| `admin` | All of editor + manage users, update roles |

`requireRole(request, roles)` checks:
1. Valid session (token is valid)
2. User's role from `public.users` matches one of the required roles
3. Returns 401 if no session, 403 if wrong role

---

## Rate Limiting

**Implementation:** In-memory `Map<string, { count, resetTime }>` in `src/lib/rate-limit.ts`.

- Applied to: `/api/auth/register` (5 req/min), `/api/auth/login` (5 req/min)
- Keyed by client IP (from `x-forwarded-for` header)
- Periodic cleanup every 60s to prevent memory leak
- **Limitation:** Resets on server restart. Acceptable for a low-traffic CMS. Swap for Upstash Redis or similar at scale.

---

## Manual Steps (User Must Perform)

1. **Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   Get it from: Supabase Dashboard → Project Settings → API → `service_role` key

2. **Enable Email/Password Auth in Supabase:**
   Dashboard → Authentication → Settings → Providers → Enable **Email**

3. **Run the schema migration first** (Supabase SQL Editor):
   Copy-paste `supabase/migrations/002_cms_schema.sql` and execute

4. **Test registration:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","display_name":"Test Author"}'
   ```

5. **Test login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```
