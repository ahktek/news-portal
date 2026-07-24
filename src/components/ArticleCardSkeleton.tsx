export default function ArticleCardSkeleton({
  variant,
}: {
  variant: "hero" | "standard" | "compact" | "list";
}) {
  // ─── HERO SKELETON ───
  if (variant === "hero") {
    return (
      <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="p-6 space-y-3">
          <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-2/5 mt-6" />
        </div>
      </div>
    );
  }

  // ─── STANDARD SKELETON ───
  if (variant === "standard") {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-4/3 w-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="p-4 space-y-2">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-2/5 mt-4" />
        </div>
      </div>
    );
  }

  // ─── COMPACT SKELETON ───
  if (variant === "compact") {
    return (
      <div className="flex gap-3 items-start py-2 animate-pulse">
        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/3" />
        </div>
      </div>
    );
  }

  // ─── LIST SKELETON ───
  return (
    <div className="py-4 animate-pulse space-y-2">
      <div className="flex gap-2">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-12" />
      </div>
      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-full mt-1" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-2/3" />
    </div>
  );
}
