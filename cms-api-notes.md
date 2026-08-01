# CMS API Layer Notes

**Date:** 2026-08-01  
**Phase:** 1 of 3  
**Consumed by:** Phase 2 (CMS Dashboard UI)

---

## Files Created

| File | Endpoint | Methods |
|---|---|---|
| `src/app/api/cms/articles/route.ts` | `/api/cms/articles` | GET (list), POST (create) |
| `src/app/api/cms/articles/[id]/route.ts` | `/api/cms/articles/:id` | GET, PATCH, DELETE |
| `src/app/api/cms/categories/route.ts` | `/api/cms/categories` | GET |
| `src/app/api/cms/upload/route.ts` | `/api/cms/upload` | POST |

---

## Authentication

All routes under `/api/cms/*` require a valid Bearer token. The token is obtained from `POST /api/auth/login` and sent as:

```
Authorization: Bearer <access_token>
```

Unauthenticated requests receive `401 { error: "Unauthorized — valid session required" }`.
Users with insufficient role receive `403 { error: "Forbidden — requires one of: editor, admin" }`.

---

## Endpoints

### 1. `GET /api/cms/articles`

Lists articles for the CMS dashboard. Authors see only their own articles. Editors/admins can pass `?all=true` to see all articles.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Items per page (max 50) |
| `all` | bool | false | If true AND user is editor/admin: returns all articles |

**Response 200:**
```json
{
  "articles": [
    {
      "id": "abc123",
      "title": "বাংলাদেশের অর্থনীতি",
      "status": "draft",
      "category": "Economics",
      "category_id": "uuid...",
      "image_url": "https://...",
      "created_at": "2026-08-01T00:00:00Z",
      "updated_at": "2026-08-01T12:00:00Z",
      "author_user_id": "uuid..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 2. `POST /api/cms/articles`

Creates a new article. Defaults to `status: "draft"`.

**Request body:**
```json
{
  "title": "string (required, max 200)",
  "content": "string (required, HTML allowed — script tags stripped)",
  "category_id": "uuid (required, must exist in categories table)",
  "image_url": "string (optional, must be valid URL)"
}
```

**Response 201:**
```json
{
  "article": {
    "id": "abc123",
    "title": "...",
    "status": "draft",
    "created_at": "...",
    ...
  }
}
```

**Validation errors — 400:**
- Empty/missing title
- Title > 200 chars
- Empty/missing content
- Missing category_id
- category_id doesn't exist in DB
- image_url is not a valid URL

---

### 3. `GET /api/cms/articles/:id`

Fetches a single article. Author can only fetch own articles; editors/admins can fetch any.

**Response 200:** `{ "article": { ... } }`  
**Response 404:** `{ "error": "Article not found" }`  
**Response 403:** `{ "error": "Forbidden" }` (not the author and not staff)

---

### 4. `PATCH /api/cms/articles/:id`

Updates an article. Partial updates supported — only send fields you want to change.

**Request body (all fields optional):**
```json
{
  "title": "string (max 200)",
  "content": "string (script tags stripped)",
  "category_id": "uuid (must exist)",
  "image_url": "string | null (valid URL or empty to clear)",
  "status": "draft | published | archived"
}
```

**Authorization rules:**
- Author: can update own articles; cannot set `status: "published"` (editors/admins only)
- Editor/Admin: can update any article, any field
- `updated_at` is auto-set by database trigger — no need to send it

**Response 200:** `{ "article": { ... } }`

---

### 5. `DELETE /api/cms/articles/:id`

**Soft-deletes** by setting `status = 'archived'`. The row is never hard-deleted.

Same ownership rules as GET/PATCH.

**Response 200:** `{ "success": true, "message": "Article archived" }`

---

### 6. `GET /api/cms/categories`

Returns all categories for the CMS category picker dropdown. No auth required.

**Response 200:**
```json
{
  "categories": [
    { "id": "uuid", "name": "জাতীয়", "slug": "national", "description": "..." },
    ...
  ]
}
```

---

### 7. `POST /api/cms/upload`

Uploads an image to Supabase Storage bucket `article-images`.

**Request:** `multipart/form-data` with field `file`

**Validation:**
- File type: `image/jpeg`, `image/png`, `image/webp` only
- File size: max 5 MB
- Requires authentication

**Response 201:**
```json
{
  "success": true,
  "url": "https://msypsrswdlvamjzgqgpg.supabase.co/storage/v1/object/public/article-images/...",
  "path": "user-uuid/1690000000000-filename.jpg"
}
```

---

## Content Sanitization

All article content passes through `sanitizeHTML()` which strips:
- `<script>...</script>` tags (including multi-line/inline variants)
- Inline event handlers (`onclick`, `onload`, etc.)

This is a baseline defense. For production, consider adding `DOMPurify` (isomorphic) or `sanitize-html` for more thorough sanitization.

---

## Public Site Compatibility

The new CMS API routes are **purely additive** — they live under `/api/cms/*` and are completely separate from the public-facing pages. The existing public site (`/`, `/article/[slug]`, `/category/[slug]`, `/search`) continues to use `src/lib/articles.ts` which queries Supabase directly with the anon key — no changes needed.

The only behavioral overlap is the RLS policy on `articles`: public SELECT only returns `status='published'`. Since all existing articles get `status='published'` by default (from the migration), the public site sees exactly the same data it always did.

---

## Manual Steps (User Must Perform)

1. **Create Supabase Storage bucket:**
   - Dashboard → Storage → New Bucket
   - Name: `article-images`
   - Check: Public bucket
   - Create

2. **Set Storage policies:**
   - Bucket → `article-images` → Policies
   - Add policy for **SELECT**: name "Public read", allowed operation: SELECT, policy: `true`
   - Add policy for **INSERT**: name "Authenticated uploads", allowed operation: INSERT, policy: `(auth.role() = 'authenticated')`

3. **Ensure the `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`** (same as auth setup)
