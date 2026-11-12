"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getPublicCategories } from "@/lib/calculators";

type NavItem = {
  label: string;
  href: string;
  match: string;
};

const ALL_TOOLS_NAV: NavItem = {
  label: "All Tools",
  href: "/calculators",
  match: "calculators",
};

const ABOUT_NAV: NavItem = {
  label: "About",
  href: "/about",
  match: "about",
};

const CONTACT_NAV: NavItem = {
  label: "Contact",
  href: "/contact",
  match: "contact",
};

const linkBase =
  "cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors";
const linkIdle = `${linkBase} font-medium text-zinc-600 hover:bg-stone-200/50 hover:text-zinc-950`;
const linkActive = `${linkBase} font-semibold bg-stone-200/70 text-zinc-950`;

type HeaderNavProps = {
  onNavigate?: () => void;
  className?: string;
  variant?: "bar" | "stack";
};

function categoryItems(): NavItem[] {
  return getPublicCategories().map((category) => ({
    label: category.title,
    href: `/${category.id}`,
    match: category.id,
  }));
}

function isActive(match: string, pathname: string) {
  if (match === "calculators") return pathname === "/calculators";
  if (match === "date-time") return pathname.startsWith("/date-time");
  if (match === "math") return pathname.startsWith("/math");
  if (match === "health") return pathname.startsWith("/health");
  if (match === "finance") return pathname.startsWith("/finance");
  if (match === "home-energy") return pathname.startsWith("/home-energy");
  if (match === "games") return pathname.startsWith("/games");
  if (match === "about") return pathname.startsWith("/about");
  if (match === "contact") return pathname.startsWith("/contact");
  return false;
}

function NavLink({
  item,
  pathname,
  onNavigate,
  className = "",
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = isActive(item.match, pathname);
  return (
    <Link
      href={item.href}
      className={`${active ? linkActive : linkIdle} ${className}`}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}

/** Primary nav — All Tools, Categories menu, About, Contact. */
export function HeaderNav({
  onNavigate,
  className = "",
  variant = "bar",
}: HeaderNavProps) {
  const pathname = usePathname();
  const categoriesId = useId();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categories = categoryItems();
  const categoryActive = categories.some((item) =>
    isActive(item.match, pathname),
  );

  useEffect(() => {
    setCategoriesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!categoriesOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!categoriesRef.current?.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoriesOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoriesOpen]);

  if (variant === "stack") {
    return (
      <nav
        aria-label="Main Navigation"
        className={`flex flex-col items-stretch gap-1 ${className}`}
      >
        <NavLink
          item={ALL_TOOLS_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
          className="w-full"
        />

        <div className="pt-1">
          <p className="ui-label px-3 py-1.5 text-[11px] font-semibold text-zinc-500">
            Categories
          </p>
          <div className="flex flex-col gap-1">
            {categories.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
                className="w-full"
              />
            ))}
          </div>
        </div>

        <NavLink
          item={ABOUT_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
          className="w-full"
        />
        <NavLink
          item={CONTACT_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
          className="w-full"
        />
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main Navigation"
      className={`flex items-center gap-1 ${className}`}
    >
      <NavLink
        item={ALL_TOOLS_NAV}
        pathname={pathname}
        onNavigate={onNavigate}
      />

      <div ref={categoriesRef} className="relative">
        <button
          type="button"
          id={categoriesId}
          className={`${categoryActive || categoriesOpen ? linkActive : linkIdle} inline-flex items-center gap-1`}
          aria-expanded={categoriesOpen}
          aria-haspopup="menu"
          aria-controls={`${categoriesId}-menu`}
          onClick={() => setCategoriesOpen((open) => !open)}
        >
          Categories
          <ChevronDown
            className={`size-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {categoriesOpen ? (
          <div
            id={`${categoriesId}-menu`}
            role="menu"
            aria-labelledby={categoriesId}
            className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-border/80 bg-panel p-1.5 shadow-card"
          >
            {categories.map((item) => {
              const active = isActive(item.match, pathname);
              return (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-stone-200/70 font-semibold text-zinc-950"
                      : "font-medium text-zinc-600 hover:bg-stone-200/50 hover:text-zinc-950"
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setCategoriesOpen(false);
                    onNavigate?.();
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <NavLink item={ABOUT_NAV} pathname={pathname} onNavigate={onNavigate} />
      <NavLink
        item={CONTACT_NAV}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
