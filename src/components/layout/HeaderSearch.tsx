"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATORS,
  isCalculatorLive,
  type CalculatorListing,
} from "@/lib/calculators";

type HeaderSearchProps = {
  className?: string;
  inputId?: string;
};

type FilterId = "all" | "date-time" | "finance" | "math";

type SearchItem = {
  tool: CalculatorListing;
  categoryId: string;
  categoryLabel: string;
  tag: string;
  section: string;
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "date-time", label: "Date & Time" },
  { id: "finance", label: "Financial" },
  { id: "math", label: "Math" },
];

const CATEGORY_TAG: Record<string, string> = {
  "date-time": "Date",
  finance: "Finance",
  health: "Health",
  math: "Math",
  "home-energy": "Home",
  games: "Games",
};

const SECTION_TITLE: Record<string, string> = {
  "date-time": "Date & Time Calculators",
  finance: "Finance & Mathematics",
  health: "Health Calculators",
  math: "Finance & Mathematics",
  "home-energy": "Home & Energy Calculators",
  games: "Games Calculators",
};

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform?.toLowerCase() ?? "";
  const ua = navigator.userAgent?.toLowerCase() ?? "";
  return platform.includes("mac") || ua.includes("mac os");
}

function isOpenShortcut(event: KeyboardEvent, isMac: boolean): boolean {
  const key = event.key.toLowerCase();
  if (key !== "k") return false;
  if (isMac) return event.metaKey && !event.ctrlKey && !event.altKey;
  return event.ctrlKey && !event.metaKey && !event.altKey;
}

function buildSearchIndex(): SearchItem[] {
  return CALCULATOR_CATEGORIES.flatMap((category) =>
    category.calculators.filter(isCalculatorLive).map((tool) => ({
      tool,
      categoryId: category.id,
      categoryLabel: category.title,
      tag: CATEGORY_TAG[category.id] ?? category.title,
      section: SECTION_TITLE[category.id] ?? category.title,
    })),
  );
}

/**
 * Command-palette search — ⌘K / Ctrl+K.
 * Centered dialog, category filters, keyboard navigation. Client-only.
 */
export function HeaderSearch({
  className = "",
  inputId,
}: HeaderSearchProps) {
  const reactId = useId();
  const fieldId = inputId ?? `site-search-${reactId}`;
  const dialogTitleId = `${fieldId}-title`;
  const listId = `${fieldId}-results`;
  const router = useRouter();
  const pathname = usePathname();
  const dialogInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("⌘K");
  const [filter, setFilter] = useState<FilterId>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const index = useMemo(() => buildSearchIndex(), []);

  useEffect(() => {
    setMounted(true);
    const mac = isMacPlatform();
    setIsMac(mac);
    setShortcutLabel(mac ? "⌘K" : "Ctrl+K");
  }, []);

  const currentTool = useMemo(
    () => LIVE_CALCULATORS.find((tool) => tool.href && pathname.startsWith(tool.href)),
    [pathname],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return index.filter((item) => {
      if (filter !== "all" && item.categoryId !== filter) return false;
      if (!trimmed) return true;
      return (
        item.tool.name.toLowerCase().includes(trimmed) ||
        item.tool.description.toLowerCase().includes(trimmed) ||
        item.tag.toLowerCase().includes(trimmed)
      );
    });
  }, [filter, index, query]);

  /** Highlighted “current / quick access” row — prefer page match, else first result. */
  const quickAccess = useMemo(() => {
    if (filtered.length === 0) return null;
    if (currentTool) {
      const match = filtered.find((item) => item.tool.id === currentTool.id);
      if (match) return match;
    }
    return filtered[0] ?? null;
  }, [currentTool, filtered]);

  const restItems = useMemo(() => {
    if (!quickAccess) return filtered;
    return filtered.filter((item) => item.tool.id !== quickAccess.tool.id);
  }, [filtered, quickAccess]);

  const flatNav = useMemo(() => {
    const rows: SearchItem[] = [];
    if (quickAccess) rows.push(quickAccess);
    rows.push(...restItems);
    return rows;
  }, [quickAccess, restItems]);

  const groupedRest = useMemo(() => {
    const groups: { section: string; items: SearchItem[] }[] = [];
    for (const item of restItems) {
      const existing = groups.find((g) => g.section === item.section);
      if (existing) existing.items.push(item);
      else groups.push({ section: item.section, items: [item] });
    }
    return groups;
  }, [restItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, filter, open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFilter("all");
    setActiveIndex(0);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => {
      dialogInputRef.current?.focus();
      dialogInputRef.current?.select();
    });
  }, []);

  const goTo = useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router],
  );

  const cycleFilter = useCallback((direction: 1 | -1) => {
    setFilter((current) => {
      const i = FILTERS.findIndex((f) => f.id === current);
      const next = (i + direction + FILTERS.length) % FILTERS.length;
      return FILTERS[next]!.id;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (!open && isOpenShortcut(event, isMac)) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (!open) return;

      if (event.key === "Tab") {
        event.preventDefault();
        cycleFilter(event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) =>
          flatNav.length === 0 ? 0 : Math.min(i + 1, flatNav.length - 1),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        const item = flatNav[activeIndex];
        if (item?.tool.href) {
          event.preventDefault();
          goTo(item.tool.href);
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    activeIndex,
    closeSearch,
    cycleFilter,
    flatNav,
    goTo,
    isMac,
    open,
    openSearch,
  ]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const dialog =
    mounted &&
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[min(12vh,5rem)] sm:px-6"
        role="presentation"
      >
        <button
          type="button"
          aria-label="Close search"
          className="absolute inset-0 cursor-pointer bg-zinc-950/45 backdrop-blur-md"
          onClick={closeSearch}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="relative z-[101] flex max-h-[min(40rem,84vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_24px_64px_-12px_rgba(24,24,27,0.4)]"
        >
          <h2 id={dialogTitleId} className="sr-only">
            Search calculators
          </h2>

          {/* Search field */}
          <div className="relative shrink-0 border-b border-stone-100">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
              <Search className="size-5" aria-hidden="true" strokeWidth={2} />
            </div>
            <label htmlFor={`${fieldId}-dialog`} className="sr-only">
              Search calculators, formulas, or jump to tool
            </label>
            <input
              ref={dialogInputRef}
              id={`${fieldId}-dialog`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search calculators, formulas, or jump to tool..."
              autoComplete="off"
              className="w-full cursor-text border-0 bg-transparent py-4 pr-16 pl-12 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-zinc-500 uppercase hover:bg-stone-100"
            >
              Esc
            </button>
          </div>

          {/* Filters */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Filter:
            </span>
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-zinc-950 text-white"
                      : "border border-stone-200 bg-stone-50 text-zinc-700 hover:bg-stone-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Calculator results"
            className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
          >
            {flatNav.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-zinc-500">
                No calculators match your search.
              </p>
            ) : (
              <>
                {quickAccess && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Current Tool &amp; Quick Access
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {activeIndex === 0 ? "1 selected" : `${flatNav.length} tools`}
                      </span>
                    </div>
                    <ResultRow
                      item={quickAccess}
                      index={0}
                      active={activeIndex === 0}
                      featured
                      isCurrentPage={
                        currentTool?.id === quickAccess.tool.id
                      }
                      onHover={() => setActiveIndex(0)}
                      onSelect={() => goTo(quickAccess.tool.href!)}
                    />
                  </div>
                )}

                {groupedRest.map((group) => (
                  <div key={group.section} className="mb-3">
                    <p className="mb-1.5 px-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      {group.section}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const index = flatNav.findIndex(
                          (row) => row.tool.id === item.tool.id,
                        );
                        return (
                          <li key={item.tool.id}>
                            <ResultRow
                              item={item}
                              index={index}
                              active={activeIndex === index}
                              featured={false}
                              isCurrentPage={false}
                              onHover={() => setActiveIndex(index)}
                              onSelect={() => goTo(item.tool.href!)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/80 px-4 py-2.5 text-[11px] text-zinc-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span className="ml-0.5">Navigate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft className="size-3" aria-hidden="true" />
                </Kbd>
                <span className="ml-0.5">Select</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>Esc</Kbd>
                <span className="ml-0.5">Close</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>Tab</Kbd>
                <span className="ml-0.5">Filter Category</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Instant offline search
            </span>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <div className={`relative hidden w-48 sm:block lg:w-64 ${className}`}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search className="size-4" aria-hidden="true" />
        </div>
        <label htmlFor={fieldId} className="sr-only">
          Quick jump to a calculator
        </label>
        <input
          id={fieldId}
          type="search"
          readOnly
          placeholder="Quick jump..."
          title={`Search calculators (${shortcutLabel})`}
          aria-haspopup="dialog"
          onFocus={(event) => {
            event.currentTarget.blur();
            openSearch();
          }}
          onClick={openSearch}
          className="w-full cursor-pointer rounded-lg border border-stone-300/80 bg-stone-200/60 py-1.5 pr-14 pl-9 text-xs text-zinc-900 placeholder-zinc-400 transition-all hover:bg-stone-200 focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={openSearch}
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2"
          aria-label={`Open search, ${shortcutLabel}`}
        >
          <kbd className="inline-flex items-center rounded border border-stone-300 bg-white/90 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 shadow-xs">
            {shortcutLabel}
          </kbd>
        </button>
      </div>
      {dialog}
    </>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center rounded border border-stone-300 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-600 shadow-xs">
      {children}
    </kbd>
  );
}

function ResultRow({
  item,
  index,
  active,
  isCurrentPage,
  onHover,
  onSelect,
}: {
  item: SearchItem;
  index: number;
  active: boolean;
  featured?: boolean;
  isCurrentPage: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const Icon = item.tool.icon;

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-search-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active
          ? "bg-zinc-950 text-white shadow-xs"
          : "text-zinc-900 hover:bg-stone-50"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
          active
            ? "border-amber-400/80 bg-zinc-900 text-amber-300"
            : "border-stone-200 bg-stone-50 text-zinc-700"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-bold ${active ? "text-white" : "text-zinc-950"}`}
          >
            {item.tool.name}
          </span>
          {(active || isCurrentPage) && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Active
            </span>
          )}
        </span>
        <span
          className={`mt-0.5 block truncate text-xs ${
            active ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {item.tool.description}
        </span>
      </span>

      {active ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-400">
          Jump
          <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-zinc-300">
            <CornerDownLeft className="size-3" aria-hidden="true" />
          </kbd>
        </span>
      ) : (
        <span className="shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
          {item.tag}
        </span>
      )}
    </button>
  );
}
