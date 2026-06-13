"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A 2px accent progress bar that starts the moment an internal link is clicked
// and completes once the new route commits. Next 14 has no router events, so we
// drive "start" from a capture-phase click listener and "finish" from a
// pathname/searchParams change.
export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (done.current) clearTimeout(done.current);
    setVisible(true);
    setProgress(8);
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.12) : p));
    }, 200);
  }

  function finish() {
    if (trickle.current) clearInterval(trickle.current);
    setProgress(100);
    done.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  }

  // Start on any same-origin link click (covers nav, tabs, row links).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (!href.startsWith("/") || href.startsWith("/api/")) return;
      const dest = new URL(href, window.location.href);
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Finish when the committed route changes.
  useEffect(() => {
    if (!visible) return;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (trickle.current) clearInterval(trickle.current);
      if (done.current) clearTimeout(done.current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="h-full bg-app-accent transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
