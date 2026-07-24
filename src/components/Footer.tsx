"use client";

import { useState } from "react";
import Link from "next/link";
import { categories as allCategories } from "@/lib/articles";

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const isSectionOpen = (section: string) => openSection === section;

  return (
    <footer className="bg-zinc-950 text-white mt-16 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Responsive layout: stacked accordion on mobile, 3-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* COLUMN 1: ABOUT / CONTACT */}
          <div className="border-b border-zinc-800 md:border-0 pb-4 md:pb-0">
            {/* Accordion header on mobile, standard header on desktop */}
            <button
              onClick={() => toggleSection("about")}
              className="flex items-center justify-between w-full md:pointer-events-none md:block text-left"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0 md:mb-4">
                আমাদের সম্পর্কে / যোগাযোগ
              </h4>
              <span className="md:hidden text-zinc-400 text-lg">
                {isSectionOpen("about") ? "−" : "+"}
              </span>
            </button>

            {/* Accordion body */}
            <div
              className={`mt-4 md:block ${
                isSectionOpen("about") ? "block" : "hidden"
              }`}
            >
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                ট্যানজেন্ট — স্বাধীন ও নিরপেক্ষ সংবাদ ও বিশ্লেষণ প্রকাশকারী প্রতিষ্ঠান। আমরা প্রযুক্তি, সংস্কৃতি এবং সমসাময়িক রাজনীতি নিয়ে বস্তুনিষ্ঠ সংবাদ পরিবেশন করি।
              </p>
              <div className="text-xs text-zinc-500 space-y-1.5 font-mono">
                <p>ইমেইল: contact@tangent.news</p>
                <p>ফোন: +৮৮০ ২-৯৯৯৯৯৯</p>
                <p>ঢাকা, বাংলাদেশ</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: SECTIONS (CATEGORIES & LINKS) */}
          <div className="border-b border-zinc-800 md:border-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection("sections")}
              className="flex items-center justify-between w-full md:pointer-events-none md:block text-left"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0 md:mb-4">
                বিভাগ ও লিংকসমূহ
              </h4>
              <span className="md:hidden text-zinc-400 text-lg">
                {isSectionOpen("sections") ? "−" : "+"}
              </span>
            </button>

            <div
              className={`mt-4 md:block ${
                isSectionOpen("sections") ? "block" : "hidden"
              }`}
            >
              <nav className="grid grid-cols-2 gap-2" aria-label="Footer categories">
                {allCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="text-xs sm:text-sm text-zinc-400 hover:text-accent-primary transition-colors no-underline"
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/search"
                  className="text-xs sm:text-sm text-zinc-400 hover:text-accent-primary transition-colors no-underline"
                >
                  অনুসন্ধান
                </Link>
                <Link
                  href="/feed.xml"
                  className="text-xs sm:text-sm text-zinc-400 hover:text-accent-primary transition-colors no-underline font-mono"
                >
                  RSS Feed
                </Link>
              </nav>
            </div>
          </div>

          {/* COLUMN 3: FOLLOW US (SOCIAL ICONS) */}
          <div className="pb-4 md:pb-0">
            <button
              onClick={() => toggleSection("social")}
              className="flex items-center justify-between w-full md:pointer-events-none md:block text-left"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0 md:mb-4">
                আমাদের অনুসরণ করুন
              </h4>
              <span className="md:hidden text-zinc-400 text-lg">
                {isSectionOpen("social") ? "−" : "+"}
              </span>
            </button>

            <div
              className={`mt-4 md:block ${
                isSectionOpen("social") ? "block" : "hidden"
              }`}
            >
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                সামাজিক যোগাযোগ মাধ্যমে আমাদের নিয়মিত সংবাদ আপডেট পান।
              </p>
              
              {/* Social Icons Layout */}
              <div className="flex gap-4 items-center">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-accent-primary transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-5 1.55-5 4.5V8z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-accent-primary transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-accent-primary transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 font-mono">
            &copy; {new Date().getFullYear()} TANGENT. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}