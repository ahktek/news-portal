"use client";

import Link from "next/link";
import { useState } from "react";
import { type FrontendArticle } from "@/lib/articles";
import { convertToBanglaDigits, getRelativeTimestamp } from "@/lib/utils";

export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-6 rounded-2xl shadow-smartmag relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-xs">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h3 className="font-sans text-xl font-extrabold tracking-tight">
          নিউজলেটার সাবস্ক্রাইব করুন
        </h3>
        <p className="mt-2 text-xs text-rose-100 leading-relaxed">
          প্রতিদিনের সেরা সংবাদ ও গুরুত্বপূর্ণ বিশ্লেষণ সরাসরি পেতে আপনার ইমেইল প্রদান করুন।
        </p>

        {subscribed ? (
          <div className="mt-4 p-3 bg-white/20 rounded-xl text-center text-xs font-bold backdrop-blur-xs">
            ✓ ধন্যবাদ! সাবস্ক্রিপশন সম্পন্ন হয়েছে।
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার ইমেইল..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/15 text-white placeholder-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-white text-rose-600 hover:bg-rose-50 font-black text-xs rounded-xl shadow-xs transition-colors"
            >
              সাবস্ক্রাইব করুন
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function SocialFollowWidget() {
  const socials = [
    { name: "Facebook", count: "৪৫কে", color: "bg-blue-600 text-white", icon: "M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-5 1.55-5 4.5V8z" },
    { name: "Twitter/X", count: "২৮কে", color: "bg-slate-900 dark:bg-slate-700 text-white", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
    { name: "Instagram", count: "৩২কে", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", icon: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" },
    { name: "YouTube", count: "১০০কে", color: "bg-red-600 text-white", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-smartmag">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-accent-primary rounded-full"></div>
        <h3 className="font-sans text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          সামাজিক যোগাযোগ
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {socials.map((s, idx) => (
          <a
            key={idx}
            href="#"
            className={`${s.color} p-3 rounded-xl flex items-center justify-between no-underline hover:opacity-90 transition-opacity shadow-xs`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d={s.icon} />
              </svg>
              <span className="text-xs font-bold">{s.name}</span>
            </div>
            <span className="text-[0.65rem] font-black opacity-80">{s.count}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function TrendingRailWidget({ articles = [] }: { articles?: FrontendArticle[] }) {
  const trendingArticles = articles.slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-smartmag">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-4 bg-accent-primary rounded-full"></div>
        <h3 className="font-sans text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          জনপ্রিয় সংবাদ
        </h3>
      </div>

      <div className="space-y-4">
        {trendingArticles.map((article, idx) => (
          <article key={article.id} className="group flex items-start gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 last:pb-0">
            {/* Numbered Badge */}
            <span className="font-mono text-xl font-black text-slate-300 dark:text-slate-700 group-hover:text-accent-primary transition-colors flex-shrink-0 w-6">
              {convertToBanglaDigits(`0${idx + 1}`)}
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[0.65rem] font-black text-accent-primary uppercase tracking-wide block mb-0.5">
                {article.category.name}
              </span>
              <Link href={`/article/${article.slug}`} className="no-underline">
                <h4 className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-accent-primary transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h4>
              </Link>
              <span className="text-[0.65rem] text-slate-400 dark:text-slate-500 mt-1 block">
                {getRelativeTimestamp(article.publishedAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
