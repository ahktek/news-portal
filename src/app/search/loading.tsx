import ArticleCardSkeleton from "@/components/ArticleCardSkeleton";

export default function SearchLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-slate-100">
      {/* ─── সার্চ ফর্ম ─── */}
      <div className="sticky top-[110px] z-20 bg-slate-50/95 dark:bg-[#0b0f19]/95 backdrop-blur pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 animate-pulse">
        {/* শিরোনাম */}
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
        {/* ফর্ম */}
        <div className="flex gap-2.5">
          {/* ইনপুট */}
          <div className="relative flex-1">
            <div className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
          </div>
          {/* বাটন */}
          <div className="h-12 w-24 bg-rose-100 dark:bg-rose-900/40 rounded-xl" />
        </div>
        {/* ফলাফল সংখ্যা */}
        <div className="mt-3 h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>

      {/* ─── ফলাফল তালিকা ─── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-5 first:pt-0">
            <ArticleCardSkeleton variant="list" />
          </div>
        ))}
      </div>
    </div>
  );
}
