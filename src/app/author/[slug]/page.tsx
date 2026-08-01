import Link from "next/link";
import { getArticles, getArticlesCount } from "@/lib/articles";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Pagination from "@/components/Pagination";

export const revalidate = 60;

const ITEMS_PER_PAGE = 8;

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { page: pageStr } = await searchParams;

  if (decodedSlug !== "desk") {
    notFound();
  }

  const author = {
    name: "TANGENT Desk",
    slug: "desk",
    bio: "TANGENT editorial desk — independent news and analysis.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=desk",
  };

  const currentPage = Math.max(1, parseInt(pageStr || "1") || 1);
  const articles = await getArticles(undefined, currentPage, ITEMS_PER_PAGE);
  const totalArticles = await getArticlesCount();
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-slate-100">
      {/* Author Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        <img
          src={author.avatarUrl}
          alt={author.name}
          className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800"
          width={80}
          height={80}
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{author.name}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">{author.bio}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            মোট প্রতিবেদন: {totalArticles}টি
          </p>
        </div>
      </div>

      {/* Articles by author */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {articles.map((article) => (
          <article key={article.id} className="py-5 first:pt-0">
            <Link href={`/article/${article.slug}`} className="group block no-underline">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-accent-primary transition-colors">
                {article.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{article.excerpt}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{formatDate(article.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readingTime} মিনিট পড়া</span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">কোনো প্রতিবেদন পাওয়া যায়নি।</p>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/author/${slug}`} />
      )}
    </div>
  );
}