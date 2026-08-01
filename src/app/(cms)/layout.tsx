/**
 * CMS route-group layout.
 *
 * Since Phase 2 dashboard integration, AuthProvider lives at the ROOT layout
 * (src/app/layout.tsx) — the public SiteHeader now reads the auth session to
 * show a conditional "Dashboard" link, which requires the provider to wrap
 * the whole app, not just this route group. This layout is now a passthrough.
 *
 * See dashboard-shell-notes.md for the rationale and compatibility notes.
 */
export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
