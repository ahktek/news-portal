"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-24">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Error icon */}
        <svg
          className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeWidth="1.8" d="M12 8v4" />
          <circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none" />
        </svg>

        {/* Heading */}
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mb-3">
          কিছু ভুল হয়েছে
        </h1>

        {/* Subtext */}
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          পৃষ্ঠাটি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
        </p>

        {/* Retry button */}
        <button
          onClick={reset}
          className="px-6 py-3 text-sm font-bold bg-accent-primary text-white rounded-xl hover:bg-accent-hover transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    </div>
  );
}
