import ArticleCardSkeleton from "@/components/ArticleCardSkeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 animate-pulse">
      {/* ─── টপ নিউজ বার স্কেলেটন ─── */}
      <div className="py-2.5 px-4 bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-primary" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* ─── স্পটলাইট সেকশন — হিরো + ২x২ গ্রিড ─── */}
      <section className="space-y-4" aria-label="লোড হচ্ছে">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* লেফট: হিরো কার্ড */}
          <div className="lg:col-span-7">
            <ArticleCardSkeleton variant="hero" />
          </div>

          {/* রাইট: ২x২ গ্রিড */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ArticleCardSkeleton variant="standard" />
            <ArticleCardSkeleton variant="standard" />
            <ArticleCardSkeleton variant="standard" />
            <ArticleCardSkeleton variant="standard" />
          </div>
        </div>
      </section>

      {/* ─── ট্যাব ও ফিড সেকশন স্কেলেটন ─── */}
      <section className="bg-white dark:bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-smartgap space-y-6">
        {/* ট্যাব বার */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-7 w-18 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* ৩-কলাম কার্ড গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} variant="standard" />
          ))}
        </div>
      </section>

      {/* ─── ৭০/৩০ মূল ফিড + সাইডবার ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <main className="lg:col-span-8 space-y-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <section key={i} className="border-b border-slate-100 dark:border-slate-800/80 pb-10 last:border-b-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, j) => (
                  <ArticleCardSkeleton key={j} variant="standard" />
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* সাইডবার */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </aside>
      </div>

      {/* ─── সম্পাদকের পছন্দ স্কেলেটন ─── */}
      <section className="bg-slate-100/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="flex overflow-x-auto gap-6 pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <ArticleCardSkeleton variant="standard" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
