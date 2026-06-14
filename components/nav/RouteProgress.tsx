"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A 2px accent progress bar that starts the moment an internal link is clicked
// and completes once the new route commits. Next 14 has no router events, so we
// drive "start" from a capture-phase click listener and "finish" from a
// pathname/searchParams change.
// Keep the bar on screen at least this long, so prefetched (near-instant)
// navigations still give a perceptible flash of feedback instead of nothing.
const MIN_VISIBLE_MS = 600;

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  function start() {
    if (visible) return; // already running — keep the original start time
    if (done.current) clearTimeout(done.current);
    startedAt.current = Date.now();
    setVisible(true);
    setProgress(8);
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.12) : p));
    }, 200);
  }

  function finish() {
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt.current));
    if (done.current) clearTimeout(done.current);
    done.current = setTimeout(() => {
      if (trickle.current) clearInterval(trickle.current);
      setProgress(100);
      done.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }, wait);
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

  // Also cover programmatic navigation (router.push/replace — e.g. after login,
  // duplicate plan) by hooking the History API the App Router drives.
  useEffect(() => {
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = ((...args: Parameters<typeof history.pushState>) => {
      const url = args[2];
      if (url && new URL(url, window.location.href).pathname !== window.location.pathname) start();
      return origPush(...args);
    }) as typeof history.pushState;
    history.replaceState = ((...args: Parameters<typeof history.replaceState>) => {
      const url = args[2];
      if (url && new URL(url, window.location.href).pathname !== window.location.pathname) start();
      return origReplace(...args);
    }) as typeof history.replaceState;
    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className="h-full bg-app-accent transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          boxShadow: "0 0 8px var(--app-accent), 0 0 2px var(--app-accent)",
        }}
      />
    </div>
  );
}
