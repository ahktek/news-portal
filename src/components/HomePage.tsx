"use client";

import { useState } from "react";
import Link from "next/link";
import { categories as mockCategories, type FrontendArticle } from "@/lib/articles";
import { getBanglaDate } from "@/lib/utils";
import ArticleCard from "@/components/ArticleCard";
import { NewsletterWidget, SocialFollowWidget, TrendingRailWidget } from "@/components/SidebarWidgets";

export default function HomePage({ articles = [] }: { articles: FrontendArticle[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");

  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-500 font-bold">
        কোনো সংবাদ পাওয়া যায়নি।
      </div>
    );
  }

  const leadStory = articles.find((a) => a.featured) || articles[0];
  const spotlightArticles = articles.filter((a) => a.id !== leadStory.id).slice(0, 4);

  // Filter for tab strip
  const tabFilteredArticles = activeTab === "all"
    ? articles.slice(0, 6)
    : articles.filter((a) => a.category.id === activeTab).slice(0, 6);

  const selectedCategorySlugs = ["politics", "economics", "sports", "tech"];
  const categorySections = mockCategories.filter((c) => selectedCategorySlugs.includes(c.id));

  const editorsPicksCollection = {
    id: "col-1",
    name: "আজকের শীর্ষ সংবাদ",
    slug: "todays-top-news",
    articles: articles.slice(5, 10),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
      {/* ─── BANGLA DATE & TRENDING BAR ─── */}
      <div className="py-2.5 px-4 bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
          </span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100">টপ নিউজ:</span>
          <span className="truncate max-w-xs sm:max-w-md text-slate-700 dark:text-slate-300">
            {leadStory.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span>{getBanglaDate()}</span>
          <span aria-hidden="true">•</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">ঢাকা</span>
        </div>
      </div>

      {/* ─── "IN SPOTLIGHT" HERO MULTI-GRID ─── */}
      <section className="space-y-4" aria-label="Featured stories">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 bg-accent-primary rounded-full"></div>
          <h2 className="font-sans text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            স্পটলাইট
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 60%: Large Featured Lead Card */}
          <div className="lg:col-span-7">
            <ArticleCard article={leadStory} variant="hero" />
          </div>

          {/* Right 40%: 2x2 Grid of Overlay Stories */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spotlightArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="overlay" />
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE CATEGORY TABS FEED ─── */}
      <section className="bg-white dark:bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-smartmag space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-accent-primary rounded-full"></div>
            <h2 className="font-sans text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              সাম্প্রতিক পোস্ট
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { slug: "all", label: "সব" },
              { slug: "politics", label: "রাজনীতি" },
              { slug: "economics", label: "অর্থনীতি" },
              { slug: "sports", label: "ক্রীড়া" },
              { slug: "tech", label: "প্রযুক্তি" },
            ].map((tab) => (
              <button
                key={tab.slug}
                onClick={() => setActiveTab(tab.slug)}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === tab.slug
                    ? "bg-accent-primary text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Filtered Grid (2 columns on tablet/desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabFilteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="standard" />
          ))}
        </div>
      </section>

      {/* ─── 70/30 MAIN FEED + SIDEBAR LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main 70% Feed */}
        <main className="lg:col-span-8 space-y-10">
          {categorySections.map((cat) => {
            const catArticles = articles.filter((a) => a.category.id === cat.id).slice(0, 4);
            if (catArticles.length === 0) return null;

            return (
              <section key={cat.id} className="border-b border-slate-100 dark:border-slate-800/80 pb-10 last:border-b-0" aria-label={cat.name}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-5 bg-accent-primary rounded-full"></div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{cat.name}</h2>
                  </div>
                  <Link href={`/category/${cat.slug}`} className="text-xs font-extrabold text-accent-primary hover:underline">
                    সব সংবাদ →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {catArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="standard" />
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        {/* Right 30% Sticky Sidebar */}
        <aside className="lg:col-span-4 space-y-8 sticky top-16">
          <SocialFollowWidget />
          <TrendingRailWidget articles={articles} />
          <NewsletterWidget />
        </aside>

      </div>

      {/* ─── TINTED EDITOR'S CHOICE STRIP ─── */}
      {editorsPicksCollection && editorsPicksCollection.articles.length > 0 && (
        <section className="bg-slate-100/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6" aria-label="Editor's Choice">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-accent-primary rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {editorsPicksCollection.name}
            </h2>
          </div>

          <div className="flex overflow-x-auto whitespace-nowrap gap-6 pb-4 scrollbar-none">
            {editorsPicksCollection.articles.map((article) => (
              <div key={article.id} className="inline-block w-80 flex-shrink-0 whitespace-normal">
                <ArticleCard article={article} variant="standard" />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}