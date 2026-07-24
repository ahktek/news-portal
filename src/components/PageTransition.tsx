"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

// Configurable transition animation duration (in milliseconds)
// Adjust this single value to make the visual animation longer or shorter (e.g., 1200ms, 1500ms)
const ANIM_DURATION = 1200;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRender = useRef(true);

  // Play entrance animation on initial load
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setAnimating(true);
      animTimerRef.current = setTimeout(() => setAnimating(false), ANIM_DURATION);
      return () => {
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
      };
    }
  }, []);

  // Prefetch all internal links on mount and whenever DOM changes
  useEffect(() => {
    const prefetchAll = () => {
      document.querySelectorAll("a[href]").forEach((anchor) => {
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("http") || href.startsWith("#")) return;
        router.prefetch(href);
      });
    };

    prefetchAll();

    // Re-run if new links are added to the DOM dynamically
    const observer = new MutationObserver(prefetchAll);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [router]);

  // Prefetch route on hover
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    router.prefetch(href);
  }, [router]);

  // Click handler: navigate instantly and trigger independent overlay animation
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank"
      ) return;

      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (href === pathname) return;

      e.preventDefault();
      e.stopPropagation();

      // 1. Instantly trigger Next.js App Router navigation
      router.push(href);

      // 2. Play independent visual transition animation simultaneously
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      setAnimating(true);
      animTimerRef.current = setTimeout(() => {
        setAnimating(false);
      }, ANIM_DURATION);
    },
    [pathname, router]
  );

  useEffect(() => {
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [handleClick, handleMouseOver]);

  return (
    <>
      {animating && (
        <div
          className="page-turn-overlay"
          aria-hidden="true"
          style={{ "--anim-duration": `${ANIM_DURATION}ms` } as React.CSSProperties}
        >
          <div className="page-turn-sheet sheet-1"></div>
          <div className="page-turn-sheet sheet-2"></div>
        </div>
      )}
      <div key={pathname} className="page-content-fade">
        {children}
      </div>
    </>
  );
}




