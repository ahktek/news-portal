"use client";

/**
 * CMS route-group layout.
 *
 * Since Phase 2 dashboard integration, AuthProvider lives at the ROOT layout
 * (src/app/layout.tsx) — the public SiteHeader now reads the auth session.
 * This layout is now a client boundary to prevent hydration mismatches
 * between the server-rendered public shell and client-state-dependent CMS pages.
 *
 * See dashboard-shell-notes.md for the rationale.
 */
export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return <div suppressHydrationWarning>{children}</div>;
}
