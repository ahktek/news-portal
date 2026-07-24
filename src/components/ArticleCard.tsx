import Link from "next/link";
import Image from "next/image";
import { getRelativeTimestamp, getCategoryBadgeClasses } from "@/lib/utils";

interface Author {
  name: string;
  slug: string;
  bio: string;
  avatarUrl: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  body: string[];
  publishedAt: string;
  readingTime: number;
  featured: boolean;
  category: Category;
  tags: Tag[];
  author: Author;
  image_url?: string;
}

interface ArticleCardProps {
  article: Article;
  variant: "hero" | "standard" | "compact" | "list" | "overlay";
  showExcerpt?: boolean;
}

export default function ArticleCard({ article, variant, showExcerpt = true }: ArticleCardProps) {
  const relativeTime = getRelativeTimestamp(article.publishedAt);
  const badgeColor = getCategoryBadgeClasses(article.category.slug);

  // ─── HERO SPOTLIGHT VARIANT ───
  if (variant === "hero") {
    return (
      <article className="group relative flex flex-col justify-between h-full bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-smartmag hover:shadow-smartmag-hover transition-all duration-300">
        <Link href={`/article/${article.slug}`} className="no-underline block h-full flex flex-col">
          {/* Image Container with Zoom */}
          <div className="relative aspect-16/10 w-full bg-gradient-to-br from-rose-50/70 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 overflow-hidden">
            {article.image_url && (
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
            {/* Overlay Category Pill */}
            <span className={`absolute top-4 left-4 ${badgeColor} text-[0.7rem] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md z-10`}>
              {article.category.name}
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-accent-primary transition-colors duration-200 leading-snug">
                {article.title}
              </h2>
              {showExcerpt && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              )}
            </div>

            {/* SmartMag Meta Row with Author Avatar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-[0.65rem] shadow-xs">
                  {article.author.name[0]}
                </div>
                <span className="text-slate-800 dark:text-slate-200 hover:text-accent-primary transition-colors">
                  {article.author.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span>{relativeTime}</span>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 0012 20.25z" />
                  </svg>
                  <span>৩</span>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // ─── OVERLAY VARIANT (Image with Text Overlaid) ───
  if (variant === "overlay") {
    return (
      <article className="group relative h-full min-h-[220px] rounded-2xl overflow-hidden shadow-smartmag hover:shadow-smartmag-hover transition-all duration-300">
        <Link href={`/article/${article.slug}`} className="no-underline block h-full flex flex-col justify-end p-5 relative z-10">
          {/* Background Image Gradient Container */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
          {article.image_url && (
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          )}

          <span className={`self-start ${badgeColor} text-[0.65rem] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md z-20 mb-2.5`}>
            {article.category.name}
          </span>
          <h3 className="font-sans text-base sm:text-lg font-bold text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-2 z-20">
            {article.title}
          </h3>
          <div className="mt-3 flex items-center gap-2 text-[0.7rem] text-slate-300 font-medium z-20">
            <span>{relativeTime}</span>
          </div>
        </Link>
      </article>
    );
  }

  // ─── STANDARD CARD VARIANT ───
  if (variant === "standard") {
    return (
      <article className="group bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-smartmag hover:shadow-smartmag-hover transition-all duration-300">
        <Link href={`/article/${article.slug}`} className="no-underline block">
          <div className="relative aspect-16/10 w-full bg-gradient-to-br from-rose-50/70 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 overflow-hidden">
            {article.image_url && (
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
            <span className={`absolute top-3 left-3 ${badgeColor} text-[0.65rem] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs z-10`}>
              {article.category.name}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-accent-primary transition-colors duration-200 leading-snug line-clamp-2">
              {article.title}
            </h3>
            {showExcerpt && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[0.7rem] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="hover:text-accent-primary transition-colors">{article.author.name}</span>
              <span>{relativeTime}</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // ─── COMPACT SIDEBAR VARIANT ───
  if (variant === "compact") {
    return (
      <article className="group py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
        <Link href={`/article/${article.slug}`} className="no-underline flex gap-3.5 items-center">
          <div className="w-16 h-16 relative rounded-xl bg-gradient-to-br from-rose-50/70 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-serif text-xl font-black text-rose-200/60 dark:text-rose-900/30 select-none">
            {article.image_url && (
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                sizes="64px"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[0.65rem] font-black text-accent-primary uppercase tracking-wide block mb-0.5">
              {article.category.name}
            </span>
            <h4 className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-accent-primary transition-colors duration-200 leading-snug line-clamp-2">
              {article.title}
            </h4>
            <span className="text-[0.65rem] text-slate-400 dark:text-slate-500 mt-1 block">
              {relativeTime}
            </span>
          </div>
        </Link>
      </article>
    );
  }

  // ─── LIST VARIANT ───
  return (
    <article className="group py-4 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
      <Link href={`/article/${article.slug}`} className="no-underline block">
        <div className="flex items-center gap-2 mb-2">
          <span className={`${badgeColor} text-[0.65rem] font-black uppercase tracking-wider px-2 py-0.5 rounded-md`}>
            {article.category.name}
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">•</span>
          <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{relativeTime}</span>
        </div>
        <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-accent-primary transition-colors duration-200 leading-snug">
          {article.title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-3 text-[0.7rem] text-slate-500 dark:text-slate-400 font-semibold">
          <span>{article.readingTime} মিনিট পড়া</span>
          <span aria-hidden="true">·</span>
          <span>লেখক: {article.author.name}</span>
        </div>
      </Link>
    </article>
  );
}
