"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { getCategoryBadgeClasses } from "@/lib/utils";
// Type-only import — erased at compile time, so Tiptap (a dependency of
// ArticleEditor.tsx) never enters this page's bundle.
import type { CmsArticle } from "@/components/cms/ArticleEditor";
import ConfirmDialog from "@/components/cms/ConfirmDialog";
import { toast } from "@/components/cms/Toast";
import { friendlyError } from "@/components/cms/friendlyError";

type StatusFilter = "all" | "draft" | "published" | "archived";

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

const STATUS_BADGE_CLASSES: Record<Exclude<StatusFilter, "all">, string> = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  archived: "bg-slate-200 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400",
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Skeleton rows matching the article-card layout: thumbnail, badge bars,
 * title bar, metadata bar and an actions placeholder. Dark-mode aware.
 */
function ArticleListSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            {/* Thumbnail placeholder */}
            <div className="w-full sm:w-24 h-32 sm:h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            {/* Body */}
            <div className="flex-1 min-w-0 space-y-2.5 pt-1 sm:pt-0">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              {/* Title bar */}
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              {/* Metadata bar */}
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Actions placeholder (desktop only, matches card) */}
            <div className="hidden sm:flex flex-col gap-2 w-20 flex-shrink-0">
              <div className="h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { token, user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CmsArticle | null>(null);
  const [archiving, setArchiving] = useState(false);

  const isStaff = user?.role === "editor" || user?.role === "admin";

  const loadArticles = useCallback(async () => {
    if (!token || !isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (isStaff) params.set("all", "true");

      const res = await fetch(`/api/cms/articles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to load articles");

      const nextArticles: CmsArticle[] = Array.isArray(data?.articles)
        ? data.articles
        : [];
      const nextPagination: PaginationInfo | null = data?.pagination ?? null;
      setArticles(nextArticles);
      setPagination(nextPagination);

      // If the last article on a deep page was archived, step back a page
      // instead of showing an empty list.
      if (
        nextArticles.length === 0 &&
        page > 1 &&
        nextPagination &&
        nextPagination.totalPages > 0
      ) {
        setPage(nextPagination.page - 1);
      }
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : "Failed to load articles",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn, isStaff, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) return;
    loadArticles();
  }, [authLoading, isLoggedIn, loadArticles]);

  // Category map for badge colors — public endpoint, no auth needed.
  useEffect(() => {
    fetch("/api/cms/categories")
      .then((r) => r.json())
      .then((d) =>
        setCategories(Array.isArray(d?.categories) ? d.categories : []),
      )
      .catch(() => {});
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filteredArticles = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => a.status === filter);
  }, [articles, filter]);

  const handleFilterChange = (next: StatusFilter) => {
    setFilter(next);
    // Tabs are client-side filters. When switching from a deep page, jump
    // back to page 1 so the filter sees fresh data instead of an empty page.
    if (next !== filter && page !== 1) setPage(1);
  };

  // ─── Archive flow: custom confirm modal → DELETE → toast ──
  const confirmArchive = async () => {
    if (!archiveTarget || !token) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/cms/articles/${archiveTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to archive article");
      toast.warning("Article archived");
      // Refetch the current page so pagination counts and tabs stay consistent.
      await loadArticles();
    } catch (err) {
      toast.error(
        friendlyError(
          err instanceof Error ? err.message : "Failed to archive article",
        ),
      );
    } finally {
      setArchiving(false);
      setArchiveTarget(null);
    }
  };

  const totalArticles = pagination?.total ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* ─── Page header ─── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Articles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {totalArticles} article{totalArticles === 1 ? "" : "s"}
            {isStaff ? " · viewing all articles (editor/admin)" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/articles/new"
          className="no-underline inline-flex items-center gap-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover px-4 py-2.5 text-sm font-bold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Article
        </Link>
      </div>

      {/* ─── Filter tabs (client-side) ─── */}
      <div
        className="flex flex-wrap gap-1.5 mb-6 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit max-w-full"
        role="group"
        aria-label="Filter articles by status"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={filter === tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              filter === tab.key
                ? "bg-accent-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-accent-primary hover:bg-white dark:hover:bg-slate-700/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Error state ─── */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadArticles}
            className="text-xs font-bold rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Loading state (first load) ─── */}
      {loading && articles.length === 0 && !error && <ArticleListSkeleton />}

      {/* ─── Article list ─── */}
      {!error && filteredArticles.length > 0 && (
        <>
          {loading && (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3" role="status">
              Loading…
            </p>
          )}
          <ul className={`space-y-3 transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}>
            {filteredArticles.map((article) => {
              const category = article.category_id
                ? categoryById.get(article.category_id)
                : undefined;
              const categorySlug =
                category?.slug ?? (article.category ?? "").toLowerCase();
              const statusLabel =
                article.status.charAt(0).toUpperCase() + article.status.slice(1);

              return (
                <li
                  key={article.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Thumbnail — smaller on mobile, card stacks vertically */}
                    {article.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-full sm:w-24 h-32 sm:h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
                        </svg>
                      </div>
                    )}

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide ${getCategoryBadgeClasses(categorySlug)}`}
                        >
                          {category?.name ?? article.category ?? "Uncategorized"}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide ${
                            STATUS_BADGE_CLASSES[article.status] ??
                            STATUS_BADGE_CLASSES.draft
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/articles/${article.id}/edit`}
                        className="no-underline block font-serif text-base sm:text-lg font-bold leading-snug text-slate-900 dark:text-white hover:text-accent-primary transition-colors line-clamp-2"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Created {formatDate(article.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions — full-width buttons on mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="no-underline inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-accent-primary hover:border-accent-primary transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(article)}
                      className="w-full sm:w-auto rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ─── Empty states ─── */}
      {!loading && !error && filteredArticles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] px-6 py-16 text-center animate-fade-in">
          {filter === "all" ? (
            <>
              <svg
                className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
              <p className="font-sans text-lg font-extrabold text-slate-800 dark:text-slate-200">
                You haven&apos;t written any articles yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Start your first story — it takes less than a minute to draft.
              </p>
              <Link
                href="/dashboard/articles/new"
                className="no-underline inline-flex items-center gap-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover px-5 py-2.5 text-sm font-bold mt-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Write your first article
              </Link>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              <p className="font-sans text-lg font-extrabold text-slate-800 dark:text-slate-200">
                No {filter} articles found
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Nothing on this page matches the {filter} filter.
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-accent-primary hover:border-accent-primary mt-6 transition-colors"
              >
                Show all articles
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between mt-8 gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-accent-primary hover:border-accent-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-accent-primary hover:border-accent-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* ─── Archive confirmation modal ─── */}
      <ConfirmDialog
        open={archiveTarget !== null}
        title={archiveTarget ? `Archive “${archiveTarget.title}”?` : ""}
        message="Archive this article? It will be hidden from the public site but still accessible in your dashboard."
        confirmLabel={archiving ? "Archiving…" : "Archive"}
        confirmDisabled={archiving}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
