"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

const ANIM_DURATION = 850;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), ANIM_DURATION);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    setDisplayChildren(children);
  }, [pathname, children]);

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

      // 1. Start animation
      setAnimating(true);

      // 2. Navigate immediately — don't wait for animation
      router.push(href);

      // 3. End animation overlay after full duration
      setTimeout(() => setAnimating(false), ANIM_DURATION);
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