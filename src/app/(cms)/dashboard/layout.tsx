"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { ToastViewport } from "@/components/cms/Toast";

/**
 * TANGENT CMS — Dashboard shell.
 *
 * Route guard: the entire /dashboard area is protected here. While the auth
 * session is being restored (isLoading) or when logged out, nothing renders
 * and an effect redirects to /login. Pages nested under this layout
 * (the article list, /articles/new, /articles/[id]/edit) never mount their
 * content until the session is confirmed.
 *
 * Layout: a left sidebar on desktop (lg+) that sticks below the public
 * header. On mobile it collapses into a sticky top bar + slide-down drawer.
 *
 * NOTE: this shell renders inside the root layout, so the public SiteHeader
 * and Footer frame the CMS area — see dashboard-shell-notes.md.
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mobile drawer a11y: close on Escape, move focus into the drawer on open.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  // Protect the route: redirect once we know the session state.
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  // While restoring the session (or right after kicking off a redirect),
  // render nothing but a spinner.
  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex items-center justify-center py-32" aria-live="polite" role="status">
        <span className="h-8 w-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-accent-primary animate-spin" />
        <span className="sr-only">Checking session…</span>
      </div>
    );
  }

  const displayName = user?.display_name || user?.email || "CMS User";
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : null;

  const myArticlesActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/articles");
  const newArticleActive = pathname === "/dashboard/articles/new";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Shared between the desktop sidebar and the mobile drawer.
  const nav = (
    <>
      {/* Brand */}
      <Link
        href="/dashboard"
        onClick={() => setMobileNavOpen(false)}
        className="no-underline flex items-center gap-2 group"
      >
        <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          TANGENT<span className="text-accent-primary">.</span>
        </span>
        <span className="text-[0.6rem] font-bold text-accent-primary bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          CMS
        </span>
      </Link>

      {/* New Article */}
      <Link
        href="/dashboard/articles/new"
        onClick={() => setMobileNavOpen(false)}
        className={`no-underline mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
          newArticleActive
            ? "bg-accent-hover text-white"
            : "bg-accent-primary text-white hover:bg-accent-hover"
        }`}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Article
      </Link>

      {/* My Articles */}
      <nav className="mt-4 space-y-1" aria-label="Dashboard navigation">
        <Link
          href="/dashboard"
          onClick={() => setMobileNavOpen(false)}
          className={`no-underline flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
            myArticlesActive
              ? "text-accent-primary bg-rose-50 dark:bg-rose-950/40"
              : "text-slate-600 dark:text-slate-300 hover:text-accent-primary hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          My Articles
        </Link>
      </nav>

      {/* User + logout */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={displayName}>
          {displayName}
        </p>
        {roleLabel && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{roleLabel}</p>
        )}
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-accent-primary hover:border-accent-primary transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="lg:flex lg:min-h-[calc(100vh-8rem)]">
      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto flex flex-col px-5 py-6 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
          {nav}
        </div>
      </aside>

      {/* ─── Mobile top bar ─── */}
      <div className="lg:hidden sticky top-12 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="no-underline flex items-center gap-2">
          <span className="font-serif text-lg font-black tracking-tight text-slate-900 dark:text-white">
            TANGENT<span className="text-accent-primary">.</span>
          </span>
          <span className="text-[0.6rem] font-bold text-accent-primary bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            CMS
          </span>
        </Link>
        <button
          ref={toggleRef}
          onClick={() => setMobileNavOpen((open) => !open)}
          className="p-2 text-slate-700 dark:text-slate-200 hover:text-accent-primary transition-colors rounded-lg"
          aria-label="Toggle dashboard navigation"
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-mobile-nav"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            {mobileNavOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* ─── Mobile drawer ─── */}
      {mobileNavOpen && (
        <div
          ref={drawerRef}
          id="dashboard-mobile-nav"
          className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-4 animate-fade-in"
          aria-label="Dashboard navigation"
        >
          {nav}
        </div>
      )}

      {/* ─── Page content ─── */}
      <main className="flex-1 min-w-0">{children}</main>

      {/* ─── Toast notifications (shared by all dashboard pages) ─── */}
      <ToastViewport />
    </div>
  );
}
