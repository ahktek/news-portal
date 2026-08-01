-- =============================================================================
-- TANGENT (ট্যানজেন্ট) — CMS Schema Migration
-- Migration: 002_cms_schema
-- Date: 2026-08-01
-- Phase 1 of 3: Database schema for the CMS dashboard.
-- Run in: Supabase Dashboard SQL Editor (https://app.supabase.com)
-- =============================================================================
-- PREREQUISITE: Migration 001_schema_expansion must already be applied.
-- This migration is purely additive — no DROP or ALTER of existing columns.
-- =============================================================================

-- ──────────────────────────────────────────────────────────
-- STEP 1: Users table (profile extension of auth.users)
-- ──────────────────────────────────────────────────────────
-- Supabase Auth (auth.users) handles authentication — this
-- table stores CMS-specific profile data (display name, role).
-- The id column matches auth.users.id so a row in public.users
-- is always 1:1 with its auth counterpart.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY,
  email        text UNIQUE NOT NULL,
  display_name text,
  role         text NOT NULL DEFAULT 'author'
               CHECK (role IN ('author', 'editor', 'admin')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'CMS user profiles — extends Supabase Auth auth.users';
COMMENT ON COLUMN users.role IS 'author | editor | admin — controls CMS access level';

-- ──────────────────────────────────────────────────────────
-- STEP 2: Categories table (replaces hardcoded TypeScript enum)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'News categories — replaces hardcoded TypeScript category enum';

-- Seed the 8 existing categories from src/lib/articles.ts
INSERT INTO categories (name, slug, description) VALUES
  ('জাতীয়',       'national',      'সারা দেশের সব গুরুত্বপূর্ণ খবর'),
  ('রাজনীতি',      'politics',      'রাজনৈতিক দল, নেতৃত্ব ও নীতিনির্ধারণী সিদ্ধান্ত'),
  ('অর্থনীতি',     'economics',     'ব্যবসা, বাণিজ্য, বাজার ও সামগ্রিক অর্থনৈতিক পরিস্থিতি'),
  ('আন্তর্জাতিক',  'international', 'বিশ্ব রাজনীতি ও আন্তর্জাতিক অঙ্গনের ঘটনাপ্রবাহ'),
  ('খেলা',         'sports',        'ক্রিকেট, ফুটবল ও অন্যান্য খেলার আপডেট ও বিশ্লেষণ'),
  ('বিনোদন',       'entertainment', 'চলচ্চিত্র, নাটক, সঙ্গীত ও সংস্কৃতি জগতের খবরাখবর'),
  ('ফিচার',        'feature',       'বিশেষ প্রতিবেদন, স্মৃতিচারণ ও দীর্ঘ বিশ্লেষণমূলক লেখা'),
  ('প্রযুক্তি',    'tech',          'বিজ্ঞান, তথ্যপ্রযুক্তি ও গ্যাজেট সম্পর্কিত নতুন সংবাদ')
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description;

-- ──────────────────────────────────────────────────────────
-- STEP 3: Additive columns on articles
-- ──────────────────────────────────────────────────────────
-- These are NEW columns — no existing column is modified or removed.
-- The existing `author_id` (→ authors table) and `category` (text)
-- columns are left unchanged for backward compatibility.
-- ──────────────────────────────────────────────────────────

-- 3a. CMS author reference (alongside existing author_id)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_user_id uuid
  REFERENCES users(id) ON DELETE SET NULL;
COMMENT ON COLUMN articles.author_user_id IS 'CMS user who authored this article (for RLS ownership checks)';

-- 3b. Publication status with safe default
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));
COMMENT ON COLUMN articles.status IS 'draft | published | archived — controls public visibility';

-- 3c. Category FK (alongside existing text `category` column)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id uuid
  REFERENCES categories(id) ON DELETE SET NULL;
COMMENT ON COLUMN articles.category_id IS 'FK to categories table — used by CMS; existing `category` text column stays for public site';

-- 3d. Last-updated timestamp
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
COMMENT ON COLUMN articles.updated_at IS 'Auto-set by trigger on every row update';

-- ──────────────────────────────────────────────────────────
-- STEP 4: Trigger — auto-set updated_at on row update
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- STEP 5: Indexes
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS articles_author_user_id_idx
  ON articles(author_user_id);
CREATE INDEX IF NOT EXISTS articles_status_idx
  ON articles(status);
CREATE INDEX IF NOT EXISTS articles_category_id_idx
  ON articles(category_id);
CREATE INDEX IF NOT EXISTS articles_updated_at_idx
  ON articles(updated_at DESC);

-- ──────────────────────────────────────────────────────────
-- STEP 6: Row Level Security (RLS)
-- ──────────────────────────────────────────────────────────

-- 6a. USERS table — only self-access; no public read
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT their own row
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow authenticated users to UPDATE their own display_name (not role)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow INSERT only via service_role (the API inserts after signup)
CREATE POLICY users_insert_service ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow insert when the id matches the authenticated user
    -- (the /api/auth/register route calls supabaseAdmin to bypass this)
    id = auth.uid()
  );

-- Allow admins to UPDATE any user's role (separate policy for clarity)
CREATE POLICY users_update_role_admin ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 6a.1 ROLE-ESCALATION GUARD (trigger)
-- RLS WITH CHECK cannot compare the NEW row against the OLD row, so the
-- users_update_own policy above (WITH CHECK id = auth.uid()) would let ANY
-- authenticated user set role = 'admin' on their own row by calling PostgREST
-- directly with their own JWT (e.g. from browser devtools). This trigger
-- rejects any JWT-authenticated role change unless the acting user is an admin.
-- (auth.uid() IS NULL contexts — service_role, SQL editor as postgres — are
-- privileged and bypass RLS anyway, so they are not policed here; anonymous
-- requests have no UPDATE policy and are blocked by RLS before this fires.)
CREATE OR REPLACE FUNCTION prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM users u
       WHERE u.id = auth.uid() AND u.role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_prevent_role_escalation ON users;
CREATE TRIGGER trg_users_prevent_role_escalation
  BEFORE UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_escalation();

-- 6b. ARTICLES table — public only sees published; authors own their drafts
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public (anon) can SELECT only published articles
CREATE POLICY articles_select_public ON articles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Authenticated users can SELECT their own articles (all statuses)
CREATE POLICY articles_select_own ON articles
  FOR SELECT
  TO authenticated
  USING (author_user_id = auth.uid());

-- Editors and admins can SELECT all articles (including drafts)
CREATE POLICY articles_select_staff ON articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  );

-- INSERT: authenticated users can create articles (author_user_id must be self)
CREATE POLICY articles_insert_own ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (author_user_id = auth.uid());

-- UPDATE: own articles only
CREATE POLICY articles_update_own ON articles
  FOR UPDATE
  TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

-- UPDATE: editors and admins can update any article
CREATE POLICY articles_update_staff ON articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (true);

-- DELETE: own articles only (uses status change instead of hard delete)
CREATE POLICY articles_delete_own ON articles
  FOR DELETE
  TO authenticated
  USING (author_user_id = auth.uid());

-- DELETE: editors and admins can delete any article
CREATE POLICY articles_delete_staff ON articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  );

-- 6c. CATEGORIES table — public read; staff write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories (needed for CMS dropdown)
CREATE POLICY categories_select_public ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only editors and admins can modify categories
CREATE POLICY categories_insert_staff ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  );

CREATE POLICY categories_update_staff ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (true);

CREATE POLICY categories_delete_staff ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('editor', 'admin')
    )
  );

-- =============================================================================
-- VERIFICATION (run after applying migration):
--
--   SELECT tablename FROM pg_tables
--     WHERE schemaname = 'public'
--     ORDER BY tablename;
--   Expected: articles, article_tags, authors, categories, comments, tags, users
--
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--     WHERE table_name = 'articles'
--     ORDER BY ordinal_position;
--   New columns: author_user_id (uuid), status (text, NOT NULL, 'published'),
--                 category_id (uuid), updated_at (timestamptz)
--
--   SELECT * FROM categories ORDER BY slug;
--   Expected: 8 rows (national, politics, …, tech)
--
--   SELECT * FROM pg_policies WHERE schemaname = 'public';
--   Expected: ~15 policies across articles, users, categories
-- =============================================================================
