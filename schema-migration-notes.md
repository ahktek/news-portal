# CMS Schema Migration Notes

**File:** `supabase/migrations/002_cms_schema.sql`  
**Date:** 2026-08-01  
**Prerequisite:** Migration `001_schema_expansion.sql` must already be applied.

---

## Summary

This migration adds 3 new tables (`users`, `categories`) and 4 new columns to the existing `articles` table, plus RLS policies, indexes, and an auto-timestamp trigger. Every change is additive — no column is dropped, renamed, or altered in a way that breaks existing queries.

---

## Tables Created

### 1. `users` — CMS User Profiles

| Column       | Type         | Constraints                  | Notes |
|-------------|-------------|-----------------------------|-------|
| `id`        | `uuid`       | PRIMARY KEY                 | Matches `auth.users.id` from Supabase Auth |
| `email`     | `text`       | UNIQUE NOT NULL             | Mirrors auth.users.email for easy lookups |
| `display_name` | `text`   |                             | Shown in CMS UI |
| `role`      | `text`       | NOT NULL, DEFAULT 'author'  | `CHECK (role IN ('author','editor','admin'))` |
| `created_at`| `timestamptz`| NOT NULL, DEFAULT now()     |  |

**Rationale:** Supabase Auth (`auth.users`) handles passwords, sessions, and email verification. This table is purely a profile extension — it stores CMS-specific metadata (display name, role) that Supabase Auth doesn't provide. No `password_hash` column exists because Supabase Auth manages credentials.

### 2. `categories` — News Categories

| Column       | Type         | Constraints              | Notes |
|-------------|-------------|--------------------------|-------|
| `id`        | `uuid`       | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `name`      | `text`       | NOT NULL                 | Bengali display name (e.g. 'জাতীয়') |
| `slug`      | `text`       | UNIQUE NOT NULL          | URL-safe identifier (e.g. 'national') |
| `description`| `text`      | DEFAULT ''               | |
| `created_at`| `timestamptz`| NOT NULL, DEFAULT now()  | |

**Seed data:** 8 rows matching the hardcoded TypeScript `categories` array in `src/lib/articles.ts`:
National, Politics, Economics, International, Sports, Entertainment, Feature, Tech.

**Rationale:** Previously, categories were a TypeScript enum/array with no database representation. This table enables category management from the CMS (add/rename/remove categories) and provides a proper FK target for articles.

---

## Columns Added to `articles`

All are `ADD COLUMN IF NOT EXISTS` — safe to re-run.

| Column           | Type    | Default    | References         | Notes |
|-----------------|--------|------------|-------------------|-------|
| `author_user_id`| `uuid`  | NULL       | `users(id) ON DELETE SET NULL` | CMS author (distinct from existing `author_id` which references the `authors` table) |
| `status`        | `text`  | NOT NULL, `'published'` | — | `CHECK (status IN ('draft','published','archived'))` |
| `category_id`   | `uuid`  | NULL       | `categories(id) ON DELETE SET NULL` | FK to new categories table (existing `category` text column stays) |
| `updated_at`    | `timestamptz` | `now()` | — | Auto-maintained by trigger |

**Backward compatibility:**
- Existing `author_id` (→ `authors` table) is untouched. `author_user_id` is a parallel column for CMS auth.
- Existing `category` text column is untouched. `category_id` is a parallel FK column.
- All existing articles get `status = 'published'` (the default), so the RLS policy that restricts public SELECT to `status='published'` doesn't hide any existing content.

---

## Trigger

**`set_updated_at()` + `trg_articles_updated_at`:**  
Before every UPDATE on `articles`, sets `updated_at = now()`. This is a standard pattern — the CMS doesn't need to manually set the timestamp on every update.

---

## Indexes

| Index Name | Column(s) | Purpose |
|---|---|---|
| `articles_author_user_id_idx` | `author_user_id` | Look up articles by CMS author |
| `articles_status_idx` | `status` | Filter by draft/published/archived |
| `articles_category_id_idx` | `category_id` | Filter CMS articles by category FK |
| `articles_updated_at_idx` | `updated_at DESC` | Sort CMS article list by last-modified |

---

## RLS Policies

### `users` table (4 policies)

| Policy | Operation | Target | Condition |
|---|---|---|---|
| `users_select_own` | SELECT | authenticated | `id = auth.uid()` |
| `users_update_own` | UPDATE | authenticated | `id = auth.uid()` (self-only, display_name changes) |
| `users_insert_service` | INSERT | authenticated | `id = auth.uid()` |
| `users_update_role_admin` | UPDATE | authenticated | Caller has `role = 'admin'` |

### `articles` table (8 policies)

| Policy | Operation | Target | Condition |
|---|---|---|---|
| `articles_select_public` | SELECT | anon, authenticated | `status = 'published'` |
| `articles_select_own` | SELECT | authenticated | `author_user_id = auth.uid()` (includes drafts) |
| `articles_select_staff` | SELECT | authenticated | Caller role IN ('editor','admin') |
| `articles_insert_own` | INSERT | authenticated | `author_user_id = auth.uid()` |
| `articles_update_own` | UPDATE | authenticated | `author_user_id = auth.uid()` |
| `articles_update_staff` | UPDATE | authenticated | Caller role IN ('editor','admin') |
| `articles_delete_own` | DELETE | authenticated | `author_user_id = auth.uid()` |
| `articles_delete_staff` | DELETE | authenticated | Caller role IN ('editor','admin') |

### `categories` table (4 policies)

| Policy | Operation | Target | Condition |
|---|---|---|---|
| `categories_select_public` | SELECT | anon, authenticated | `true` (everyone can read) |
| `categories_insert_staff` | INSERT | authenticated | Caller role IN ('editor','admin') |
| `categories_update_staff` | UPDATE | authenticated | Caller role IN ('editor','admin') |
| `categories_delete_staff` | DELETE | authenticated | Caller role IN ('editor','admin') |

---

## Manual Steps (User Must Perform)

1. **Open Supabase Dashboard** → SQL Editor (https://app.supabase.com)
2. **Copy-paste** the entire contents of `supabase/migrations/002_cms_schema.sql`
3. **Run** (Cmd/Ctrl + Enter)
4. **Verify** with the verification queries at the bottom of the migration file
5. **Enable Email/Password Auth:** Go to Authentication → Settings → Providers → enable **Email** (this is needed for Sub Agent B's auth routes)
6. **Create Storage Bucket:** Go to Storage → New Bucket → name it `article-images` → set to **public** (needed for CMS image uploads in Phase 2)
