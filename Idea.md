# TANGENT (ট্যানজент) — Project Architecture & Implementation Blueprint

> **Notice for Hermes Agent**: This document provides a comprehensive technical overview, architectural design, database schema, design system, component hierarchy, and maintenance guidelines for **TANGENT** — an independent, high-performance Bengali news and analysis web application.

---

## 1. Project Overview

* **Name**: TANGENT (ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ)
* **Tagline**: Independent Bengali News, Politics, Economics & Culture Zine
* **Primary Language**: Bengali (`bn`)
* **Deployment Target**: Vercel Serverless Platform
* **Live URL**: [https://tangentnews.vercel.app/](https://tangentnews.vercel.app/)

---

## 2. Tech Stack & Key Dependencies

| Component | Technology | Version / Details |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.2.10` (Turbopack enabled) |
| **UI Library** | React | `19.2.4` |
| **Language** | TypeScript | `^5.0.0` |
| **Styling** | Tailwind CSS | `v4` (`@import "tailwindcss"`) |
| **Database** | Supabase REST API | `@supabase/supabase-js ^2.110.8` |
| **Fonts** | Google Fonts | Inter, Merriweather, JetBrains Mono |
| **Icons** | Custom Inline SVG | Lightweight, zero-dependency inline SVGs |

---

## 3. Project Directory Structure

```
news-portal/
├── public/
│   └── icon.svg              # Favicon SVG
├── src/
│   ├── app/                  # Next.js App Router Routes
│   │   ├── layout.tsx        # Root Layout with ThemeProvider & HTML structure
│   │   ├── page.tsx          # Homepage (Dynamic Server Component)
│   │   ├── globals.css       # Design tokens, Tailwind v4 imports, Custom dark variant
│   │   ├── article/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Article detail page
│   │   ├── author/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Author profile & list of published articles
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Paginated category articles page
│   │   ├── search/
│   │   │   └── page.tsx      # Real-time article search page
│   │   └── feed.xml/
│   │       └── route.ts      # Dynamic RSS XML Feed route handler
│   ├── components/           # UI Components
│   │   ├── ArticleCard.tsx   # Multi-variant news cards (hero, overlay, standard, compact, list)
│   │   ├── BackToTop.tsx     # Floating scroll-to-top button
│   │   ├── CommentSection.tsx# Interactive article comment discussion box
│   │   ├── Footer.tsx        # Site footer with directory links & contact info
│   │   ├── HomePage.tsx      # Interactive home feed layout with Spotlight & Tabs
│   │   ├── PageTransition.tsx# Page turn animation with DOM MutationObserver prefetching
│   │   ├── Pagination.tsx    # Category & Author page pagination controls
│   │   ├── SidebarWidgets.tsx# Trending Rail, Social Follow, and Newsletter Subscription
│   │   ├── SiteHeader.tsx    # Sticky header with mobile navigation & dark mode toggle
│   │   └── ThemeProvider.tsx # Class-based dark mode state provider
│   └── lib/                  # Utilities & API Clients
│       ├── articles.ts       # Supabase database query functions & mapping utilities
│       ├── supabase.ts       # Robust Supabase client initialization & URL sanitization
│       └── utils.ts          # Date formatting, Bengali numerals conversion, category badges
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration (colors, font families)
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and build scripts
```

---

## 4. Architectural Principles & Critical Fixes

### A. Dynamic Data & Vercel SSG Cache Prevention
To ensure news updates render on demand rather than serving empty static build artifacts:
- Server routes (`page.tsx`, `category/[slug]/page.tsx`, `article/[slug]/page.tsx`, `author/[slug]/page.tsx`) explicitly export:
  ```ts
  export const revalidate = 60;
  export const dynamic = "force-dynamic";
  ```
- Supabase REST client in `src/lib/supabase.ts` uses `cache: 'no-store'` for fetch calls to prevent stale Next.js Data Cache entries.

### B. Bulletproof Database Client Fallback (`src/lib/supabase.ts`)
- Sanitizes environment variables (stripping quotes, whitespace).
- Parses PostgreSQL URLs (`postgresql://...`) to extract project references (`msypsrswdlvamjzgqgpg`) and construct standard REST URLs (`https://<ref>.supabase.co`).
- Validates anon key format (JWT starting with `eyJ`). If Vercel environment variables are missing or invalid, seamlessly falls back to valid default public credentials.

### C. Tailwind CSS v4 Class-Based Dark Mode (`src/app/globals.css`)
- Uses `@custom-variant dark (&:where(.dark, .dark *));` to enforce class-based dark mode (`<html class="dark">`).
- Prevents system media query (`prefers-color-scheme: dark`) from overriding user preference in Inspect Element or mobile devices.

### D. High-Performance Page Transitions (`src/components/PageTransition.tsx`)
- Intercepts clicks and triggers instant `router.push(href)` without delaying page rendering.
- Runs a 1200ms independent visual page-turn animation (`.page-turn-overlay` with `--anim-duration: 1200ms`).
- Automatically scans internal links on mount and uses a `MutationObserver` on `document.body` to prefetch new links (`router.prefetch()`) as they enter the DOM.

---

## 5. Database Schema (Supabase `articles` table)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` / `text` | Primary Key | Unique article identifier |
| `title` | `text` | NOT NULL | Article headline |
| `content` | `text` | NOT NULL | Main article body paragraphs (newline-separated) |
| `category` | `text` | NOT NULL | Category name (`National`, `Politics`, `Economics`, `International`, `Sports`, `Entertainment`, `Feature`, `Tech`) |
| `image_url` | `text` | Optional | Article image CDN URL |
| `source_url` | `text` | Optional | Source link |
| `created_at` | `timestamp` | NOT NULL | Publication timestamp |

---

## 6. Design System & Typography

- **Light Mode Background**: `#f8fafc` (slate-50) | **Text**: `#0f172a` (slate-900)
- **Dark Mode Background**: `#0b0f19` | **Header/Card Dark**: `#0f172a` / `#1e293b`
- **Accent Color**: `#e11d48` (SmartMag Editorial Red) | **Hover**: `#be123c`
- **Typography**:
  - `Merriweather`: Serif headings & body typography
  - `Inter`: UI labels, category pills & navigation text
  - `JetBrains Mono`: Code snippets, timestamps & numerals

---

## 7. Useful Developer Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle & run TypeScript checks
npm run build

# Start production server
npm run start
```

---

## 8. Guidelines for Hermes Agent

1. **Preserve Dynamic Flags**: Always keep `export const dynamic = "force-dynamic"` on App Router pages fetching Supabase data.
2. **Use Utility Functions**: Use `convertToBanglaDigits()`, `getBanglaDate()`, and `getRelativeTimestamp()` from `src/lib/utils.ts` for all display dates and numbers.
3. **Responsive Testing**: When adding UI components, ensure dark mode utility classes (`dark:...`) are provided alongside light mode classes.
