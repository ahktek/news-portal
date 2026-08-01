-- =============================================================================
-- TANGENT (ট্যানজেন্ট) — Schema Expansion Migration
-- Migration: 001_schema_expansion
-- Date: 2026-07-29
-- Phase 2: Adds slug, excerpt, authors, tags, article_tags, comments,
--          performance indexes, and GIN full-text search.
-- Run in: Supabase Dashboard SQL Editor (https://app.supabase.com)
-- =============================================================================

-- ──────────────────────────────────────────────────────────
-- STEP 1: Add slug column to articles
-- ──────────────────────────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug text;
UPDATE articles SET slug = id::text WHERE slug IS NULL;
ALTER TABLE articles ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);

-- ──────────────────────────────────────────────────────────
-- STEP 2: Add pre-computed excerpt column
-- Avoids fetching 2KB+ content body in list queries.
-- Matches mapArticle() excerpt length (160 chars).
-- ──────────────────────────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS excerpt text
  GENERATED ALWAYS AS (LEFT(content, 160)) STORED;

-- ──────────────────────────────────────────────────────────
-- STEP 3: Authors table
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default author for all existing articles
INSERT INTO authors (name, slug, bio)
VALUES ('বাংলানিউজ ডেস্ক', 'desk', 'ট্যানজেন্ট-এর জ্যেষ্ঠ সাংবাদিক ও রাজনৈতিক বিশ্লেষক।')
  ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- STEP 4: Add author reference to articles
-- ──────────────────────────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES authors(id);
UPDATE articles SET author_id = (SELECT id FROM authors WHERE slug = 'desk')
  WHERE author_id IS NULL;

-- ──────────────────────────────────────────────────────────
-- STEP 5: Tags table + article_tags junction
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ──────────────────────────────────────────────────────────
-- STEP 6: Comments table
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 50),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_article_id_idx ON comments(article_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- ──────────────────────────────────────────────────────────
-- STEP 7: Performance indexes
-- ──────────────────────────────────────────────────────────
-- Accelerates homepage /latest-articles ORDER BY created_at
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at DESC);

-- Accelerates category-filtered paginated queries
-- (e.g. GET /category/national?page=2)
CREATE INDEX IF NOT EXISTS articles_category_created_at_idx
  ON articles(category, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- STEP 8: GIN full-text search index (Bengali + English)
-- Uses 'simple' config — no language-specific stemming —
-- which works for both Bengali and English text.
-- ──────────────────────────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS articles_search_vector_idx
  ON articles USING GIN(search_vector);

-- ──────────────────────────────────────────────────────────
-- Migration complete. Verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Expected output: articles, authors, tags, article_tags, comments
-- ──────────────────────────────────────────────────────────
