import ArticleCardSkeleton from "@/components/ArticleCardSkeleton";

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ─── হেডার ─── */}
      <div className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-700/50 animate-pulse">
        {/* বিভাগ লেবেল */}
        <div className="h-4 w-16 bg-rose-100 dark:bg-rose-900/40 rounded-md" />
        {/* শিরোনাম */}
        <div className="mt-3 space-y-2">
          <div className="h-10 sm:h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        {/* বর্ণনা */}
        <div className="mt-2.5 space-y-1.5">
          <div className="h-4 w-full max-w-xl bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-4 w-3/4 max-w-lg bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* ─── ৩-কলাম গ্রিড ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <ArticleCardSkeleton key={i} variant="standard" />
        ))}
      </div>

      {/* ─── প্যাজিনেশন ─── */}
      <div className="mt-8 flex justify-center animate-pulse">
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-10 bg-red-100 dark:bg-rose-900/40 rounded-lg" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
