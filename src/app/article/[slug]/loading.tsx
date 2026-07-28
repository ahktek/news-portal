export default function ArticleLoading() {
  return (
    <div className="bg-white dark:bg-[#0b0f19] min-h-screen text-slate-900 dark:text-slate-100 py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* ─── ব্রেডক্রাম্ব ─── */}
        <nav className="flex items-center gap-2 mb-4">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <span className="text-slate-300 dark:text-slate-700">»</span>
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </nav>

        {/* ─── ক্যাটাগরি ব্যাজ ─── */}
        <div className="mb-3">
          <div className="h-5 w-24 bg-rose-100 dark:bg-rose-900/40 rounded-full" />
        </div>

        {/* ─── হেডলাইন ─── */}
        <div className="space-y-3">
          <div className="h-10 sm:h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 sm:h-12 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-8 sm:h-10 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>

        {/* ─── লেখক বাইলাইন ─── */}
        <div className="mt-6 py-4 border-y border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* অ্যাভাটার সার্কেল */}
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
          {/* শেয়ার বাটন */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>

        {/* ─── হিরো ইমেজ (অ্যাসপেক্ট-ভিডিও) ─── */}
        <div className="my-8">
          <div className="aspect-video lg:aspect-21/9 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="mt-3 flex justify-between px-1">
            <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>

        {/* ─── লেখার মূল অংশ ─── */}
        <div className="max-w-[720px] mx-auto py-4 space-y-5">
          {/* লিড প্যারাগ্রাফ */}
          <div className="space-y-2">
            <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-11/12 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          {/* ব্লককোট */}
          <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-r-2xl border-l-4 border-slate-200 dark:border-slate-700" />
          {/* বডি প্যারাগ্রাফ */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-11/12 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
          {/* ট্যাগ */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
            <div className="h-6 w-16 bg-rose-100 dark:bg-rose-900/40 rounded-full" />
            <div className="h-6 w-20 bg-rose-100 dark:bg-rose-900/40 rounded-full" />
            <div className="h-6 w-24 bg-rose-100 dark:bg-rose-900/40 rounded-full" />
          </div>
          {/* লেখক বায়ো বক্স */}
          <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      </article>

      {/* ─── সম্পর্কিত সংবাদ ─── */}
      <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-100 dark:border-slate-800 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-4/3 w-full bg-slate-200 dark:bg-slate-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-2/5 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── মন্তব্য সেকশন ─── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
