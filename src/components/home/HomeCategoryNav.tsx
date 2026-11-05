"use client";

import { useEffect, useState } from "react";
import {
  getPublicCategories,
  LIVE_CALCULATOR_COUNT,
  freeCalculatorsLabel,
  isCalculatorCatalogVisible,
} from "@/lib/calculators";

/**
 * Sticky category jump links.
 */
export function HomeCategoryNav() {
  const categories = getPublicCategories();
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");

  useEffect(() => {
    const sections = categories.map((category) =>
      document.getElementById(category.id),
    ).filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActiveId(top);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [categories]);

  return (
    <nav
      aria-label="Tool Categories"
      className="sticky top-16 z-30 border-b border-stone-200 bg-[#FAF9F6]/95 py-2.5 backdrop-blur-md"
      id="all-calculators"
    >
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {categories.map((category) => {
            const total = category.calculators.filter(
              isCalculatorCatalogVisible,
            ).length;
            const isActive = activeId === category.id;
            return (
              <a
                key={category.id}
                href={`#${category.id}`}
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-zinc-700 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {category.title} ({total})
              </a>
            );
          })}
        </div>
        <div className="hidden items-center text-xs text-zinc-600 lg:flex">
          <span>{freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)}</span>
        </div>
      </div>
    </nav>
  );
}
