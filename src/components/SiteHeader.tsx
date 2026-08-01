"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { categories as mockCategories } from "@/lib/articles";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/useAuth";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isActive = (slug: string) => pathname === `/category/${slug}`;

  return (
    <header className="w-full bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* ─── TOP HEADER ROW (Social, Logo, Subscribe) ─── */}
      <div className="border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Social Icons (Desktop) */}
          <div className="hidden md:flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs md:w-1/4">
            <a href="#" className="hover:text-accent-primary transition-colors" aria-label="Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-5 1.55-5 4.5V8z"/></svg>
            </a>
            <a href="#" className="hover:text-accent-primary transition-colors" aria-label="Twitter/X">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="hover:text-accent-primary transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="hover:text-accent-primary transition-colors" aria-label="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>

          {/* Centered Brand Logo */}
          <Link href="/" className="no-underline flex items-center justify-center gap-1.5 md:w-2/4">
            <span className="font-sans text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              TANGENT<span className="text-accent-primary">.</span>
            </span>
            <span className="hidden sm:inline text-[0.65rem] font-bold text-accent-primary bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              গুড নিউজ
            </span>
          </Link>

          {/* Subscribe & Login buttons */}
          <div className="flex items-center justify-end gap-3 md:w-1/4" suppressHydrationWarning>
            <button className="text-xs font-extrabold bg-accent-primary text-white hover:bg-accent-hover px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs transition-all duration-200">
              সাবস্ক্রাইব
            </button>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="no-underline text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 hover:text-accent-primary transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="no-underline text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-accent-primary transition-colors hidden sm:block"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* ─── MAIN STICKY NAVIGATION ROW ─── */}
      <div className={`sticky top-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-b transition-all duration-200 ${
        scrolled ? "shadow-md border-slate-200/60 dark:border-slate-800" : "border-slate-100 dark:border-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          
          {/* Hamburger Menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-700 dark:text-slate-200 hover:text-accent-primary transition-colors rounded-lg lg:hidden flex-shrink-0"
            aria-label="Toggle mobile navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>

          {/* Category Navigation Strip */}
          <nav
            className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-4 sm:gap-6 py-1"
            aria-label="Primary navigation"
          >
            <Link
              href="/"
              className={`inline-block text-xs sm:text-sm font-extrabold transition-all no-underline ${
                pathname === "/" ? "text-accent-primary" : "text-slate-800 dark:text-slate-200 hover:text-accent-primary"
              }`}
            >
              প্রচ্ছদ
            </Link>
            {mockCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`inline-block text-xs sm:text-sm font-extrabold transition-all no-underline ${
                  isActive(cat.slug)
                    ? "text-accent-primary"
                    : "text-slate-700 dark:text-slate-300 hover:text-accent-primary"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search & Dark Mode Toggle Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Inline Search Input */}
            <div className="flex items-center justify-end relative">
              <form
                onSubmit={handleSearchSubmit}
                className={`flex items-center bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-all duration-300 ${
                  searchOpen ? "w-36 sm:w-56 px-3 py-1 border border-slate-200 dark:border-slate-700" : "w-0 opacity-0 pointer-events-none"
                }`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="খুঁজুন..."
                  className="w-full bg-transparent text-xs py-0.5 focus:outline-none text-slate-900 dark:text-slate-100"
                />
                <button type="submit" className="text-slate-500 dark:text-slate-400 hover:text-accent-primary p-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-accent-primary transition-colors rounded-full"
                aria-label="Search"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Dark Mode Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-accent-primary transition-colors rounded-full"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="w-4.5 h-4.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-3 space-y-2">
          {mockCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-accent-primary py-1.5"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

    </header>
  );
}
