"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global triggers for programmatic navigation
export function startRouteProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pixzora-route-start"));
  }
}

export function finishRouteProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pixzora-route-finish"));
  }
}

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setProgress(18);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + Math.floor(Math.random() * 8 + 6);
        if (prev < 80) return prev + Math.floor(Math.random() * 4 + 2);
        if (prev < 94) return prev + 1;
        return prev;
      });
    }, 180);
  };

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 250);
  };

  // Route changed: complete progress bar
  useEffect(() => {
    finish();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [pathname, searchParams]);

  // Intercept anchor clicks and custom events
  useEffect(() => {
    const handleRouteStart = () => start();
    const handleRouteFinish = () => finish();

    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, new tabs, downloads, hashes, modifier keys
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href === pathname
      ) {
        return;
      }

      start();
    };

    window.addEventListener("pixzora-route-start", handleRouteStart);
    window.addEventListener("pixzora-route-finish", handleRouteFinish);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("pixzora-route-start", handleRouteStart);
      window.removeEventListener("pixzora-route-finish", handleRouteFinish);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 999999,
        pointerEvents: "none",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
          boxShadow: "0 0 14px rgba(99, 102, 241, 0.8), 0 0 6px rgba(236, 72, 153, 0.9)",
          transition: progress === 100 ? "width 0.15s ease-out" : "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}
      >
        {/* Glow peg at the leading edge */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "-2px",
            width: "80px",
            height: "7px",
            background: "radial-gradient(ellipse at right, rgba(236, 72, 153, 0.9) 0%, rgba(99, 102, 241, 0) 70%)",
            opacity: isVisible && progress < 100 ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
