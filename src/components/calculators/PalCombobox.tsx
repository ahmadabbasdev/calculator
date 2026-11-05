"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PalRecord } from "@/lib/palworld/schema";

type Props = {
  label: string;
  pals: PalRecord[];
  value: string;
  onChange: (id: string) => void;
  emptyLabel?: string;
};

/**
 * Accessible searchable combobox for Pal selection (name search).
 */
export function PalCombobox({
  label,
  pals,
  value,
  onChange,
  emptyLabel = "Select a Pal",
}: Props) {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = pals.find((pal) => pal.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pals;
    return pals.filter(
      (pal) =>
        pal.name.toLowerCase().includes(q) ||
        pal.id.toLowerCase().includes(q),
    );
  }, [pals, query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-zinc-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex]
              ? `${listId}-option-${filtered[activeIndex]!.id}`
              : undefined
          }
          value={open ? query : selected?.name ?? ""}
          placeholder={emptyLabel}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((i) =>
                filtered.length === 0 ? 0 : Math.min(i + 1, filtered.length - 1),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && open && filtered[activeIndex]) {
              event.preventDefault();
              choose(filtered[activeIndex]!.id);
            } else if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          className="w-full cursor-text rounded-lg border border-border bg-white py-2.5 pr-10 pl-3 text-[15px] text-foreground outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-white py-1 shadow-card"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No Pals match.</li>
          ) : (
            filtered.map((pal, index) => {
              const active = index === activeIndex;
              const isSelected = pal.id === value;
              return (
                <li
                  key={pal.id}
                  id={`${listId}-option-${pal.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`cursor-pointer px-3 py-2 text-[14px] ${
                    active ? "bg-stone-100 text-foreground" : "text-zinc-800"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(pal.id);
                  }}
                >
                  <span className="font-medium">{pal.name}</span>
                  <span className="ml-2 text-xs text-muted">rank {pal.rank}</span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
