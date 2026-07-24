"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

const ANIM_DURATION = 850; // ms — matches CSS animation length

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const pendingHref = useRef<string | null>(null);
  const initialRender = useRef(true);

  // On first mount, play the entrance animation once
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), ANIM_DURATION);
      return () => clearTimeout(t);
    }
  }, []);

  // When pathname changes (after navigation completes), update displayed children
  useEffect(() => {
    setDisplayChildren(children);
  }, [pathname, children]);

  // Global click interceptor — catch all internal <a> clicks
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, anchors, mailto, tel, etc.
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      // Skip if modifier keys held (new tab, etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Skip if same page
      if (href === pathname) return;

      // Prevent default navigation, play animation, then navigate
      e.preventDefault();
      e.stopPropagation();

      pendingHref.current = href;
      setAnimating(true);

      // Navigate partway through the animation (after sheets cover the screen)
      setTimeout(() => {
        router.push(pendingHref.current!);
        pendingHref.current = null;
      }, 10);

      // End animation after full duration
      setTimeout(() => {
        setAnimating(false);
      }, ANIM_DURATION);
    },
    [pathname, router]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [handleClick]);

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
