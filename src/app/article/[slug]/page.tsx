import Link from "next/link";
import Image from "next/image";
import { getArticleById, getArticles } from "@/lib/articles";
import { formatDate, getCategoryBadgeClasses } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommentSection from "@/components/CommentSection";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const article = await getArticleById(decodedSlug);

  if (!article) {
    return {
      title: "পাওয়া যায়নি — ট্যানজেন্ট",
      description: "এই নিবন্ধটি পাওয়া যায়নি।",
    };
  }

  const title = `${article.title} — ট্যানজেন্ট`;
  const description = article.excerpt || article.title;
  const imageUrl =
    article.image_url ||
    "https://tangentnews.vercel.app/og-default.png";
  const url = `https://tangentnews.vercel.app/article/${decodedSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ট্যানজেন্ট",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: "article",
      locale: "bn_BD",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const article = await getArticleById(decodedSlug);
  if (!article) notFound();

  const badgeColor = getCategoryBadgeClasses(article.category.slug);

  // Fetch related articles of the same category, filtering out the current article
  const relatedArticles = await getArticles(article.category.id, 1, 4);
  const related = relatedArticles
    .filter((a) => String(a.id) !== String(article.id))
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#0b0f19] min-h-screen text-slate-900 dark:text-slate-100 py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─── BREADCRUMB ─── */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-4 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent-primary transition-colors no-underline">
            প্রচ্ছদ
          </Link>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">»</span>
          <Link href={`/category/${article.category.slug}`} className="hover:text-accent-primary transition-colors no-underline">
            {article.category.name}
          </Link>
        </nav>

        {/* ─── CATEGORY BADGE ─── */}
        <div className="mb-3">
          <span className={`${badgeColor} text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xs`}>
            {article.category.name}
          </span>
        </div>

        {/* ─── HEADLINE ─── */}
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-50">
          {article.title}
        </h1>

        {/* ─── AUTHOR BYLINE ROW ─── */}
        <div className="mt-6 py-4 border-y border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary text-white flex items-center justify-center font-black text-sm shadow-xs">
              {article.author.name[0]}
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                {article.author.name}
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                <span>প্রকাশিত: {formatDate(article.publishedAt)}</span>
                <span aria-hidden="true">•</span>
                <span>{article.readingTime} মিনিট পড়া</span>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors" aria-label="Share on Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-5 1.55-5 4.5V8z"/></svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-colors" aria-label="Share on Twitter/X">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors" aria-label="Share on WhatsApp">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            </button>
          </div>
        </div>

        {/* ─── HERO IMAGE ─── */}
        <div className="my-8">
          <div className="relative aspect-video lg:aspect-21/9 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-smartmag border border-slate-100 dark:border-slate-800">
            {article.image_url && (
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            )}
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic flex justify-between px-1 font-medium">
            <span>ফাইল ছবি: বাংলাদেশ ও এর গুরুত্বের প্রতীকী চিত্র।</span>
            <span>ছবি: ট্যানজেন্ট ফাইল/রয়টার্স</span>
          </div>
        </div>

        {/* ─── CONSTRAINED ARTICLE BODY ─── */}
        <div className="max-w-[720px] mx-auto py-4 space-y-6 text-slate-800 dark:text-slate-200 font-sans text-base sm:text-lg leading-relaxed">
          {article.body.map((paragraph, i) => {
            if (i === 0) {
              return (
                <p key={i} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {paragraph}
                </p>
              );
            }
            if (paragraph.startsWith('"') && paragraph.endsWith('"')) {
              return (
                <blockquote key={i} className="border-l-4 border-accent-primary pl-5 my-8 italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 p-5 rounded-r-2xl shadow-xs">
                  {paragraph.replace(/^"(.*)"$/, "$1")}
                </blockquote>
              );
            }
            return <p key={i}>{paragraph}</p>;
          })}

          {/* Tag Chips */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs font-bold text-accent-primary bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-4 py-1.5 rounded-full hover:bg-accent-primary hover:text-white transition-colors cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* ─── AUTHOR BIO BOX ─── */}
          <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-accent-primary text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-xs">
              {article.author.name[0]}
            </div>
            <div>
              <h4 className="font-sans text-base font-extrabold text-slate-900 dark:text-slate-100">
                {article.author.name}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {article.author.bio || "ট্যানজেন্ট-এর জ্যেষ্ঠ সাংবাদিক ও রাজনৈতিক বিশ্লেষক। সমসাময়িক বিষয়াবলী ও গ্লোবাল ট্রেড নিয়ে নিয়মিত কলাম লিখছেন।"}
              </p>
            </div>
          </div>
        </div>

      </article>

      {/* ─── RELATED ARTICLES SECTION ─── */}
      {related.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-100 dark:border-slate-800 mt-16 py-12" aria-label="Related articles">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-5 bg-accent-primary rounded-full"></div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                আরও পড়ুন: {article.category.name}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <ArticleCard key={r.id} article={r} variant="standard" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <CommentSection articleId={String(article.id)} />
      </section>
    </div>
  );
}