# TANGENT CMS — Security & Permissions Audit

**Date:** 2026-08-01
**Scope:** Phase 1 CMS backend (`/api/cms/*`, `/api/auth/*`), RLS migration `002_cms_schema.sql`, public-site article access paths.
**Method:** Read-only investigation of all route handlers, libs, migration SQL, and public rendering paths; two confirmed gaps fixed with small targeted patches. `npx tsc --noEmit` passes clean after changes.

---

## 1. Auth enforcement on `/api/cms/*` routes — ✅ PASS

| Route | Auth | Ownership / role check |
|---|---|---|
| `GET /api/cms/articles` | `requireAuth()` ✅ | Authors filtered to `author_user_id = auth.user.id`; editors/admins see all only with `?all=true` ✅ |
| `POST /api/cms/articles` | `requireAuth()` ✅ | `author_user_id` forced to `auth.user.id` server-side (not taken from body) ✅ |
| `GET /api/cms/articles/[id]` | `requireAuth()` ✅ | `getArticleOrDeny()`: non-existent → 404; other user's article → 403; staff bypass ✅ |
| `PATCH /api/cms/articles/[id]` | `requireAuth()` ✅ | Same ownership gate; body cannot set `author_user_id`/`id`; authors blocked from `status='published'` (staff only) ✅ |
| `DELETE /api/cms/articles/[id]` | `requireAuth()` ✅ | Same ownership gate; soft-delete → `archived` ✅ |
| `GET /api/cms/categories` | Intentionally public ✅ | Documented in file header ("needed for CMS dropdown"); consistent with RLS `categories_select_public` for anon ✅ |
| `POST /api/cms/upload` | `requireAuth()` ✅ | Uploads namespaced under `auth.user.id/` ✅ |

**Cross-user ID-guessing (A vs B):** A user with `author_user_id=A` cannot GET/PATCH/DELETE an article owned by B — `getArticleOrDeny()` compares `article.author_user_id !== userId` → 403, regardless of the guessed ID. Confirmed by code read of `src/app/api/cms/articles/[id]/route.ts` (lines 17–41).

**Coverage check:** No other route files exist under `src/app/api/` beyond auth + cms (verified by file inventory). No missing-handler gaps.

---

## 2. RLS defense-in-depth — ⚠️ ONE CONFIRMED GAP (FIXED)

All three CMS tables (`users`, `articles`, `categories`) have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

| Policy | RLS rule (what SHOULD be) | App-level equivalent | Verdict |
|---|---|---|---|
| `articles_select_public` | anon + authenticated see only `status='published'` | Public site uses anon client (no status filter needed) | ✅ Backstop for public site |
| `articles_select_own` | authenticated sees own rows (all statuses) | CMS dashboard filters by `author_user_id` | ✅ |
| `articles_select_staff` | editors/admins see all | `?all=true` + staff check | ✅ |
| `articles_insert_own` | `WITH CHECK author_user_id = auth.uid()` | POST forces self | ✅ |
| `articles_update_own` | `USING`/`WITH CHECK author_user_id = auth.uid()` | PATCH ownership gate | ✅ |
| `articles_update_staff` | editors/admins update any | staff bypass | ✅ |
| `articles_delete_own` / `_staff` | own / staff | soft-delete via PATCH gate | ✅ |
| `categories_select_public` | anon read | public endpoint | ✅ |
| `categories_insert/update/delete_staff` | editors/admins only | no write endpoint exists yet (none needed) | ✅ |
| `users_select_own` / `users_insert_service` | self-select / self-insert | register uses service_role | ✅ |
| `users_update_own` | `USING (id = auth.uid()) WITH CHECK (id = auth.uid())` | no app route updates users | ❌ **GAP — see fix 1** |
| `users_update_role_admin` | admins update any row | — | ✅ |

### CONFIRMED GAP (fixed): self-service role escalation via `users_update_own`

**Problem:** RLS `WITH CHECK` evaluates the NEW row only and cannot compare against the OLD row. The `users_update_own` policy therefore lets any authenticated user update their own row with `role = 'admin'` — directly exploitable by calling PostgREST with their own JWT (e.g. `PATCH /rest/v1/users?id=eq.<own-id>` from browser devtools). Any registered author can become admin, bypassing all CMS role checks.

**Fix (in `supabase/migrations/002_cms_schema.sql`, added as section 6a.1):** a `BEFORE UPDATE OF role` trigger that rejects role changes unless the acting user is an admin. `auth.uid() IS NULL` contexts (service_role, SQL editor) are exempt — they are privileged and bypass RLS anyway; anonymous requests are already blocked by RLS before the trigger fires.

```sql
-- Before: the policy alone (vulnerable)
CREATE POLICY users_update_own ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());   -- ← role not constrained; self-escalation possible

-- After: policy + guard trigger
CREATE OR REPLACE FUNCTION prevent_self_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_users_prevent_role_escalation
  BEFORE UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_escalation();
```

### RLS vs app-code defense (assessment note)

- **Public site:** RLS is a genuine backstop — even if `src/lib/articles.ts` dropped every status filter, anon queries would still only return `published` rows.
- **CMS API routes:** use `supabaseAdmin` (service_role), which **bypasses RLS by design**. Defense-in-depth for the CMS API therefore rests entirely on the app-level checks (which are present and correct — see §1). This is an architectural property, not a bug; flagged so reviewers know RLS is NOT a second layer for `/api/cms/*`. If stricter defense-in-depth is desired, the routes could use the user's own JWT client instead of service_role — a larger refactor, out of scope here.
- **No-RLS tables:** `authors`, `tags`, `article_tags`, `comments` (from migration 001) have no RLS. Out of CMS scope; `comments` is currently client-side mock state only. Flagged for a future migration.

---

## 3. Password & auth security — ✅ PASS

| Check | Result |
|---|---|
| Register validates email format server-side | ✅ `EMAIL_REGEX` in `register/route.ts` (line 17, used line 44) |
| Register validates password min 8 server-side | ✅ `password.length < 8` rejected (line 47) |
| Rate limiting 5/min/IP on register | ✅ `rateLimit(ip, 5, 60_000)` before any processing (line 22) |
| Rate limiting 5/min/IP on login | ✅ `rateLimit(ip, 5, 60_000)` (line 19) |
| No `password_hash` column anywhere | ✅ `users` table (migration 002) has `id, email, display_name, role, created_at` only; Supabase Auth (`auth.users`) owns credentials |
| Password/hash never returned in API responses | ✅ register/login responses contain id/email/role/tokens only |
| Auth tokens never logged / exposed in errors | ✅ `console.error` calls log only Supabase `error.message` (no tokens); client-facing errors are generic strings |

**Minor observations (no fix applied):**
- Register returns "This email may already be registered" for a signup collision — mild account-enumeration signal; acceptable trade-off for UX, consider a uniform message later.
- `getClientIP()` trusts `x-forwarded-for` (spoofable if the host is not behind a trusted proxy) and the limiter is in-memory (per-instance, resets on restart). Fine for low-traffic CMS; swap for Redis-backed limiter at scale.

---

## 4. Image upload security — ⚠️ HARDENING APPLIED

| Check | Result |
|---|---|
| Type validation server-side (not just client) | ✅ existing `ALLOWED_TYPES` check in the route — but relied on client-supplied `file.type` (spoofable) → **fixed with magic-byte sniffing** |
| Size validation server-side (max 5 MB) | ✅ `file.size > MAX_SIZE` rejected (line 89) |
| Unique naming prevents cross-user overwrite | ✅ `${auth.user.id}/${timestamp}-${safeName}` + `upsert: false`; filename sanitized to `[a-zA-Z0-9._-]` (no path traversal) |

**Fix (in `src/app/api/cms/upload/route.ts`):** verify the file's actual magic bytes (JPEG `FF D8 FF`, PNG signature, WebP `RIFF..WEBP`) instead of trusting the declared MIME type, and use the sniffed canonical type as the stored `contentType`.

```ts
// Before: trusted the client-supplied MIME header
if (!ALLOWED_TYPES.includes(file.type)) { /* reject */ }
...
.upload(filePath, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: false });

// After: added sniffImageType(bytes) helper + content verification
const bytes = new Uint8Array(await file.arrayBuffer());
const sniffedType = sniffImageType(bytes);
if (!sniffedType) {
  return NextResponse.json({ error: 'File content is not a valid image (jpg, png, or webp)' }, { status: 400 });
}
.upload(filePath, bytes, { contentType: sniffedType, upsert: false });
```

**Remaining note (no change):** storage-bucket policies ("authenticated can INSERT, public can SELECT") are dashboard configuration documented in the route header — verify manually in Supabase Dashboard; the migration file cannot enforce them.

---

## 5. Draft article inaccessibility on the public site — ✅ PASS

- **`.single()` behavior:** `getArticleById` (`src/lib/articles.ts`) uses `supabase.from('articles').eq('id', id).single()`. RLS applies at row level *before* `.single()` — a draft matches zero rows for anon, `.single()` returns `PGRST116`, the code returns `null`, and `src/app/article/[slug]/page.tsx` calls `notFound()` (line 68). **No bypass, no 406 risk** — `.eq('id', ...)` targets a primary key so multiple rows (the 406 trigger) are impossible. Visiting `/article/<draft-id>` yields a 404, not a rendered draft. ✅
- **`searchArticles`:** has no status filter, but runs on the anon client → RLS returns published rows only. Drafts cannot appear in search results. ✅
- **Session-leak check (the subtle one):** the CMS stores its token under a **custom** localStorage key `tangent_auth` and never calls `setSession`/`supabase.auth` anywhere in client code (grep-verified). The shared public anon client (`src/lib/supabase.ts`) therefore never holds a session, so a logged-in CMS user browsing the public site still queries as the `anon` role and RLS still hides drafts. ✅
- **Warning:** if the CMS is ever migrated to supabase-js session persistence (default `sb-<ref>-auth-token` key), the public anon client would inherit the session and `articles_select_own`/`_staff` would leak drafts to logged-in users on the public site. Keep the custom storage key, or isolate the public client's storage.

---

## 6. Summary of fixes applied

| # | Severity | File | Issue | Fix |
|---|---|---|---|---|
| 1 | **Critical** | `supabase/migrations/002_cms_schema.sql` | `users_update_own` RLS policy allowed any user to self-promote to `role='admin'` via PostgREST (WITH CHECK can't compare old/new rows) | Added `prevent_self_role_escalation()` BEFORE UPDATE trigger (section 6a.1) |
| 2 | Medium | `src/app/api/cms/upload/route.ts` | Upload type check trusted client-supplied MIME header; HTML/JS payloads could be stored as "images" | Added `sniffImageType()` magic-byte verification; canonical sniffed type used for storage |

No changes to public-site rendering, routing, or caching. `npx tsc --noEmit` passes (exit 0).

**Note on migration state:** per project context, `002_cms_schema.sql` may not have been applied to the live Supabase project yet. This audit evaluated the SQL file (what SHOULD be in place). **Action required:** run the updated migration in the Supabase SQL editor so both the RLS policies and the new trigger are live. The trigger is additive and safe to apply alongside the existing migration.

---

## Overall security assessment

The TANGENT CMS Phase 1 backend is in **good shape**: every `/api/cms/*` handler authenticates and enforces ownership/role checks; the public site is correctly isolated from draft content by RLS + the custom token-storage design; passwords are validated and rate-limited server-side; credentials never leave Supabase Auth.

Two gaps were found and fixed: a **critical RLS privilege-escalation** (self-service `role='admin'` via the `users_update_own` policy — closed with a guard trigger) and a **medium upload MIME-spoofing** hole (closed with magic-byte validation).

**Residual risks (accepted / out of scope):**
1. CMS API routes use the service-role key, so RLS is not a second layer for them — app-level checks are the only defense (they are correct today).
2. In-memory rate limiter trusting `x-forwarded-for` — acceptable for low traffic; replace with Redis + trusted-proxy config at scale.
3. `authors`/`tags`/`article_tags`/`comments` lack RLS (pre-CMS tables) — future migration recommended.
4. Upload bucket policies are dashboard-managed — verify "authenticated INSERT / public SELECT" manually.
