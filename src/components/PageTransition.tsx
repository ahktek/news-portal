"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

const MIN_ANIMATION_TIME = 400; // Minimum duration for smooth visual transition

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [animating, setAnimating] = useState(false);
  const animStartTime = useRef<number>(0);
  const prevPathname = useRef<string>(pathname);

  // When pathname changes (Next.js finished loading the new route), dismiss the overlay
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      
      const elapsed = Date.now() - animStartTime.current;
      const remaining = Math.max(0, MIN_ANIMATION_TIME - elapsed);

      const timer = setTimeout(() => {
        setAnimating(false);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Prefetch on hover (mouseover)
  const handleMouseEnter = useCallback((e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    router.prefetch(href);
  }, [router]);

  // Prefetch on mobile touchstart
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    router.prefetch(href);
  }, [router]);

  // Handle link clicks: start overlay and router.push simultaneously
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

      // Start transition and trigger route change simultaneously
      animStartTime.current = Date.now();
      setAnimating(true);
      router.push(href);
    },
    [pathname, router]
  );

  useEffect(() => {
    document.addEventListener("mouseover", handleMouseEnter, true);
    document.addEventListener("touchstart", handleTouchStart, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mouseover", handleMouseEnter, true);
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [handleClick, handleMouseEnter, handleTouchStart]);

  return (
    <>
      {animating && (
        <div className="page-turn-overlay" aria-hidden="true">
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


