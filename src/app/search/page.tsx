import { searchArticles } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const results = query ? await searchArticles(query) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ─── PINNED SEARCH INPUT ─── */}
      <div className="sticky top-[110px] z-20 bg-white/95 backdrop-blur pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-tangent-black mb-4">
          অনুসন্ধান
        </h1>
        <form action="/search" method="GET" className="flex gap-2.5">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="সংবাদ শিরোনাম খুঁজুন..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-tangent-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 text-sm font-bold bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-colors shadow-xs"
          >
            খুঁজুন
          </button>
        </form>

        {/* Result count */}
        {query && (
          <p className="mt-3 text-xs text-tangent-slate">
            &ldquo;{query}&rdquo; এর জন্য {results.length}টি ফলাফল
          </p>
        )}
      </div>

      {/* ─── RESULTS FEED (list variant) ─── */}
      {results.length > 0 ? (
        <div className="divide-y divide-tangent-border/60 mt-2">
          {results.map((article) => (
            <div key={article.id} className="py-5 first:pt-0">
              <ArticleCard article={article} variant="list" />
            </div>
          ))}
        </div>
      ) : query ? (
        /* ─── EMPTY STATE ─── */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-20 h-20 text-zinc-200 mb-6" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            <path strokeLinecap="round" d="M8 11h6M11 8v6" strokeWidth="1.5" />
          </svg>
          <p className="text-lg font-bold text-tangent-black mb-1">
            কোনো ফলাফল পাওয়া যায়নি
          </p>
          <p className="text-sm text-tangent-slate max-w-xs">
            &ldquo;{query}&rdquo; দিয়ে কোনো সংবাদ পাওয়া যায়নি। অন্য শব্দ ব্যবহার করে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : (
        /* ─── INITIAL STATE ─── */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-16 h-16 text-zinc-200 mb-5" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-sm text-tangent-slate">
            সংবাদ খুঁজতে ওপরে টাইপ করুন।
          </p>
        </div>
      )}
    </div>
  );
}