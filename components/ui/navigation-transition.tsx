"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { MushroomLoader } from "./mushroom-loader";

/**
 * Minimum duration in milliseconds that the mushroom loader must remain visible.
 * This guarantees the animation is comfortably visible and prevents rapid UI
 * flickering ("dhak-dhak") when server responses or pages resolve quickly.
 */
const MIN_DISPLAY_DURATION = 650;

/**
 * Maximum safety duration in milliseconds before forcibly closing the loader
 * in case a route load encounters an unhandled stall.
 */
const SAFETY_MAX_TIMEOUT = 10000;

export function NavigationTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store the last confirmed path and search params
  const lastUrlRef = useRef<string>(
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : ""
  );

  const endTransition = useCallback(() => {
    if (!startTimeRef.current) {
      setIsNavigating(false);
      setIsFadingOut(false);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_DURATION - elapsed);

    // Clear any existing timer
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);

    pendingTimerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for 250ms smooth CSS fade-out before unmounting
      setTimeout(() => {
        setIsNavigating(false);
        setIsFadingOut(false);
        startTimeRef.current = null;
      }, 250);
    }, remaining);
  }, []);

  // Whenever Next.js finishes navigating to the new route, pathname or searchParams updates
  useEffect(() => {
    const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    if (isNavigating && currentUrl !== lastUrlRef.current) {
      lastUrlRef.current = currentUrl;
      endTransition();
    } else {
      lastUrlRef.current = currentUrl;
    }
  }, [pathname, searchParams, isNavigating, endTransition]);

  // Intercept click on internal navigation links
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Don't intercept modified clicks (Ctrl, Cmd, Shift, Alt, middle-click)
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = (event.target as HTMLElement).closest("a");
      if (!target) return;

      const rawHref = target.getAttribute("href");
      if (!rawHref) return;

      // Skip external links, tel, mailto, hashes, downloads, or target="_blank"
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:") ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      try {
        const targetUrl = new URL(target.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Check if destination is on the same origin
        if (targetUrl.origin !== currentUrl.origin) return;

        // If clicking the current exact page and query, do not trigger loader
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // Start smooth navigation state
        startTimeRef.current = Date.now();
        setIsFadingOut(false);
        setIsNavigating(true);

        // Safety fallback timer so it never stays stuck indefinitely
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsNavigating(false);
            setIsFadingOut(false);
            startTimeRef.current = null;
          }, 250);
        }, SAFETY_MAX_TIMEOUT);
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      aria-live="assertive"
      aria-label="Loading page"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-stone-50/70 dark:bg-[#0b120f]/75 backdrop-blur-md transition-opacity duration-250 ease-out select-none pointer-events-auto ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`flex items-center justify-center transform transition-all duration-250 ${
          isFadingOut ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <MushroomLoader size="xl" message="" />
      </div>
    </div>
  );
}

export default NavigationTransition;
