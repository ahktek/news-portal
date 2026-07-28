export default function AuthorLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-slate-100">
      {/* ─── লেখক হেডার ─── */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10 animate-pulse">
        {/* অ্যাভাটার */}
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {/* নাম */}
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          {/* বায়ো */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          {/* মোট প্রতিবেদন */}
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* ─── প্রতিবেদন তালিকা ─── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-5 first:pt-0 space-y-3">
            {/* শিরোনাম */}
            <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-700 rounded" />
            {/* এক্সসার্পট */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            {/* তারিখ ও পড়ার সময় */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
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
