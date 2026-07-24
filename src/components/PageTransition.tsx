"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

const ANIM_DURATION = 850;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const pendingChildren = useRef<React.ReactNode>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRender = useRef(true);

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

  // When new children arrive (page loaded), stash them
  // If animation is still running, wait for it to finish before swapping
  useEffect(() => {
    if (animating) {
      // Page loaded while animation is still going — queue the swap
      pendingChildren.current = children;
    } else {
      // Animation already done, swap immediately
      setDisplayChildren(children);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, children]);

  // When animation ends, flush any pending children
  const endAnimation = useCallback(() => {
    setAnimating(false);
    if (pendingChildren.current !== null) {
      setDisplayChildren(pendingChildren.current);
      pendingChildren.current = null;
    }
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    router.prefetch(href);
  }, [router]);

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

      // Clear any previous timer
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      pendingChildren.current = null;

      setAnimating(true);
      router.push(href);

      // End animation after duration — endAnimation will flush children if ready
      animTimerRef.current = setTimeout(endAnimation, ANIM_DURATION);
    },
    [pathname, router, endAnimation]
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
        <div className="page-turn-overlay" aria-hidden="true">
          <div className="page-turn-sheet sheet-1"></div>
          <div className="page-turn-sheet sheet-2"></div>
        </div>
      )}
      <div className="page-content-fade">
        {displayChildren}
      </div>
    </>
  );
}



