"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExt from "@tiptap/extension-image";
import { useAuth } from "@/lib/useAuth";
import { toast } from "@/components/cms/Toast";
import { friendlyError } from "@/components/cms/friendlyError";

export interface CmsArticle {
  id: string; title: string; content: string;
  status: "draft" | "published" | "archived";
  category_id: string | null; category?: string;
  image_url: string | null; created_at: string;
  updated_at: string; author_user_id: string;
}

interface Category { id: string; name: string; slug: string; }

/**
 * Skeleton shown while an existing article is being fetched (edit mode).
 * Mirrors the editor layout: headline bar, formatting toolbar, content
 * area, metadata fields, save buttons. Dark-mode aware via `dark:` variants.
 */
export function ArticleEditorSkeleton() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading editor"
    >
      {/* Headline bar */}
      <div className="h-9 sm:h-11 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-6" />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 mb-4 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-9 rounded bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] mb-6 p-4 space-y-3">
        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-11/12 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
          <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div>
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
          <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Save buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 w-full sm:w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-full sm:w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export default function ArticleEditor({ article, onSave }: { article?: CmsArticle | null; onSave?: () => void }) {
  const { token, user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(article?.title ?? "");
  const [categoryId, setCategoryId] = useState(article?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(article?.image_url ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dirtyRef = useRef(false);
  const lastSavedRef = useRef(article?.content ?? "");
  const articleIdRef = useRef(article?.id ?? null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your article..." }),
      ImageExt,
    ],
    content: article?.content ?? "",
    onUpdate: ({ editor: ed }) => {
      if (ed.getHTML() !== lastSavedRef.current) dirtyRef.current = true;
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate dark:prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none font-serif text-base",
        "aria-label": "Article body",
      },
    },
  });

  const currentContent = useEditorState({ editor, selector: (snap) => snap.editor?.getHTML() ?? "" });

  // Fetch categories
  useEffect(() => {
    fetch("/api/cms/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  // ─── Autosave (30s idle) ─────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      if (!dirtyRef.current || !token) return;
      await doSave("draft", true);
    }, 30_000);
  }, [token]);

  useEffect(() => { scheduleAutosave(); }, [title, currentContent, categoryId, scheduleAutosave]);

  // ─── Unsaved changes guard ───────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ─── Save ────────────────────────────────────────────────
  const doSave = async (saveStatus: "draft" | "published", isAutosave = false) => {
    if (!token || !editor) return;
    const body = JSON.stringify({
      title: title.trim(),
      content: currentContent,
      category_id: categoryId || null,
      image_url: imageUrl || null,
      status: saveStatus,
    });

    const method = articleIdRef.current ? "PATCH" : "POST";
    const url = articleIdRef.current
      ? `/api/cms/articles/${articleIdRef.current}`
      : "/api/cms/articles";

    if (!isAutosave) { setSaving(true); }

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Save failed");

      if (!articleIdRef.current && data.article?.id) {
        articleIdRef.current = data.article.id;
        router.replace(`/dashboard/articles/${data.article.id}/edit`);
      }
      dirtyRef.current = false;
      lastSavedRef.current = currentContent || "";
      if (!isAutosave) {
        toast.success(
          saveStatus === "published"
            ? "Published — now live on the site"
            : "Article saved",
        );
      }
      onSave?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      if (!isAutosave) toast.error(friendlyError(msg));
    } finally {
      if (!isAutosave) setSaving(false);
    }
  };

  // ─── Image upload ────────────────────────────────────────
  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploading(true); setUploadError(null);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/cms/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Upload failed");
      setImageUrl(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(friendlyError(msg));
      toast.error(friendlyError(msg));
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ─── Loading / Error states ──────────────────────────────
  if (!user && !article) {
    return <ArticleEditorSkeleton />;
  }

  const authorName = user?.display_name || user?.email || "Unknown";
  const isPublished = article?.status === "published";

  const toolbarButtons = [
    { label: "B", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") ?? false, title: "Bold" },
    { label: "I", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") ?? false, title: "Italic" },
    { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) ?? false, title: "Heading 2" },
    { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) ?? false, title: "Heading 3" },
    { label: "•", action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") ?? false, title: "Bullet list" },
    { label: "1.", action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") ?? false, title: "Numbered list" },
    { label: "❝", action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote") ?? false, title: "Blockquote" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Title */}
      <input
        aria-label="Article headline"
        className="w-full text-xl sm:text-3xl font-serif font-bold bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 pb-3 mb-6 focus:outline-none focus:border-accent-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        placeholder="Enter headline..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Toolbar */}
      {editor && (
        <div
          role="toolbar"
          aria-label="Formatting tools"
          className="flex flex-wrap gap-1 mb-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          {toolbarButtons.map((btn) => (
            <button
              key={btn.title}
              type="button"
              onClick={btn.action}
              title={btn.title}
              aria-label={btn.title}
              aria-pressed={btn.active}
              className={`px-2.5 py-1 text-sm font-bold rounded transition-colors ${
                btn.active
                  ? "bg-accent-primary text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor content */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-[#0f172a] mb-6">
        <EditorContent editor={editor} />
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5" htmlFor="article-category">
            Category
          </label>
          <select
            id="article-category"
            className="admin-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Author (read-only) */}
        <div>
          <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Author</span>
          <div className="admin-input bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed">
            {authorName}
          </div>
        </div>
      </div>

      {/* Image upload */}
      <div className="mb-6">
        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Featured Image</span>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            imageUrl ? "border-green-300 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20" : "border-slate-300 dark:border-slate-600 hover:border-accent-primary"
          }`}
        >
          {imageUrl ? (
            <div className="space-y-3">
              <img src={imageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              <button onClick={() => setImageUrl("")} className="text-xs text-accent-primary hover:underline font-bold">Remove</button>
            </div>
          ) : (
            <div>
              {/* Keyboard-reachable label: Enter/Space opens the file picker,
                  click and drag-and-drop work as before. */}
              <label
                role="button"
                tabIndex={0}
                aria-label="Upload a featured image"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="inline-block cursor-pointer text-sm font-bold text-accent-primary hover:text-accent-hover"
              >
                {uploading ? "Uploading..." : "Drag & drop or click to upload"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 5MB</p>
            </div>
          )}
          {uploadError && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400 mt-2">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Dates (read-only, edit mode only) */}
      {article && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs text-slate-500 dark:text-slate-400">
          <div><span className="font-bold uppercase">Created:</span> {new Date(article.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
          <div><span className="font-bold uppercase">Updated:</span> {new Date(article.updated_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
        </div>
      )}

      {/* Status note */}
      <div className="mb-6 p-3 rounded-lg border text-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <span className="font-bold">Status:</span>{" "}
        <span className={`font-bold ${isPublished ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {isPublished ? "Published — live on the public site" : "Draft — only visible to you in the CMS"}
        </span>
      </div>

      {/* Save buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={() => doSave("draft")}
          disabled={saving || !title.trim() || !currentContent}
          className="admin-btn w-full sm:w-auto bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 rounded-lg px-5 py-2.5 font-bold text-sm"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={() => doSave("published")}
          disabled={saving || !title.trim() || !currentContent}
          className="admin-btn w-full sm:w-auto bg-accent-primary text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg px-5 py-2.5 font-bold text-sm"
        >
          {saving ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
