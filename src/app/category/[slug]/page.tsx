import { getArticles, getArticlesCount, categories } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";

const reverseCategoryMap: Record<string, string> = {
  national: 'National',
  politics: 'Politics',
  economics: 'Economics',
  international: 'International',
  sports: 'Sports',
  entertainment: 'Entertainment',
  feature: 'Feature',
  tech: 'Tech'
};

const ITEMS_PER_PAGE = 9;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { page: pageStr } = await searchParams;
  
  const category = categories.find((c) => c.slug === decodedSlug);
  const dbCategory = reverseCategoryMap[decodedSlug];
  if (!category || !dbCategory) notFound();

  const currentPage = Math.max(1, parseInt(pageStr || "1") || 1);
  const articles = await getArticles(dbCategory, currentPage, ITEMS_PER_PAGE);
  const totalArticles = await getArticlesCount(dbCategory);
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ─── HEADER ─── */}
      <div className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-700/50">
        <span className="text-xs font-black uppercase tracking-wider text-accent-primary bg-accent-primary/10 dark:bg-accent-primary/20 px-3 py-1 rounded-md">
          বিভাগ
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 mt-3 leading-tight">
          {category.name}
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-3xl">
          {category.description}
        </p>
      </div>

      {/* ─── ARTICLES GRID ─── */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="standard" />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400 text-center py-16">
          এই বিভাগে এখনও কোনো সংবাদ নেই।
        </p>
      )}

      {/* ─── PAGINATION ─── */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/category/${slug}`} />
        </div>
      )}
    </div>
  );
}