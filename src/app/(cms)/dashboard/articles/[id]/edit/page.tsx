"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ArticleEditor, {
  ArticleEditorSkeleton,
  type CmsArticle,
} from "@/components/cms/ArticleEditor";
import { friendlyError } from "@/components/cms/friendlyError";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { token, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!token) return;

    fetch(`/api/cms/articles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 404) { setError("That article could not be found. It may have been moved or deleted."); return; }
        if (res.status === 403) { setError("You don't have permission to edit this article."); return; }
        if (!res.ok) throw new Error("Failed to load article");
        const data = await res.json();
        setArticle(data.article);
      })
      .catch((err) =>
        setError(
          friendlyError(
            err instanceof Error ? err.message : "Failed to load article",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [id, token, isLoggedIn, authLoading, router]);

  if (authLoading || loading) {
    return <ArticleEditorSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p role="alert" className="font-sans text-lg font-extrabold text-slate-800 dark:text-slate-200">
          {error}
        </p>
        <a href="/dashboard" className="inline-block mt-4 text-accent-primary hover:underline font-bold text-sm">
          ← Back to dashboard
        </a>
      </div>
    );
  }

  return <ArticleEditor article={article} />;
}
