import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Inline SVG — magnifying glass icon */}
        <div className="mx-auto flex items-center justify-center">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-slate-200 dark:text-slate-800 transition-colors duration-300"
            aria-hidden="true"
          >
            <circle
              cx="40"
              cy="40"
              r="26"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
            />
            <line
              x1="58"
              y1="58"
              x2="82"
              y2="82"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="40"
              cy="40"
              r="10"
              fill="currentColor"
              opacity="0.15"
            />
            <line
              x1="40"
              y1="28"
              x2="40"
              y2="34"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.4"
            />
            <line
              x1="40"
              y1="46"
              x2="40"
              y2="52"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.4"
            />
            <line
              x1="28"
              y1="40"
              x2="34"
              y2="40"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.4"
            />
            <line
              x1="46"
              y1="40"
              x2="52"
              y2="40"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* 404 — Bengali numeral */}
        <h1 className="font-display text-8xl sm:text-9xl font-black tracking-tight text-accent-primary leading-none">
          ৪০৪
        </h1>

        {/* Heading */}
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">
          পৃষ্ঠাটি পাওয়া যায়নি
        </h2>

        {/* Subtext */}
        <p className="font-sans text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed transition-colors duration-300">
          আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই বা স্থানান্তর করা হয়েছে।
        </p>

        {/* Home link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-accent-primary text-white font-display font-semibold text-base hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary transition-colors duration-200 shadow-sm"
          >
            প্রচ্ছদে ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
}
