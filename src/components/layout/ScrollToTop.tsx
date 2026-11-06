"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reset window scroll on App Router navigations.
 * Global `scroll-smooth` on <html> can leave the previous page's offset.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
