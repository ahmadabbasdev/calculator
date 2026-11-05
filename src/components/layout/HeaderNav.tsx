"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPalworldVerified } from "@/lib/palworld/load";

const BASE_NAV = [
  { label: "All Tools", href: "/calculators", match: "calculators" as const },
  { label: "Date & Time", href: "/date-time", match: "date-time" as const },
  { label: "Financial", href: "/finance", match: "finance" as const },
  {
    label: "Health & Fitness",
    href: "/health",
    match: "health" as const,
  },
  { label: "Math & Numbers", href: "/math", match: "math" as const },
] as const;

const GAMES_NAV = {
  label: "Games",
  href: "/games",
  match: "games" as const,
} as const;

const ABOUT_NAV = {
  label: "About",
  href: "/about",
  match: "about" as const,
} as const;

const CONTACT_NAV = {
  label: "Contact",
  href: "/contact",
  match: "contact" as const,
} as const;

const linkBase =
  "cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors";
const linkIdle = `${linkBase} font-medium text-zinc-600 hover:bg-stone-200/50 hover:text-zinc-950`;
const linkActive = `${linkBase} font-semibold bg-stone-200/70 text-zinc-950`;

type HeaderNavProps = {
  onNavigate?: () => void;
  className?: string;
  variant?: "bar" | "stack";
};

type NavMatch =
  | (typeof BASE_NAV)[number]["match"]
  | typeof GAMES_NAV.match
  | typeof ABOUT_NAV.match
  | typeof CONTACT_NAV.match;

function isActive(match: NavMatch, pathname: string) {
  if (match === "calculators") return pathname === "/calculators";
  if (match === "date-time") return pathname.startsWith("/date-time");
  if (match === "math") return pathname.startsWith("/math");
  if (match === "health") return pathname.startsWith("/health");
  if (match === "finance") return pathname.startsWith("/finance");
  if (match === "games") return pathname.startsWith("/games");
  if (match === "about") return pathname.startsWith("/about");
  if (match === "contact") return pathname.startsWith("/contact");
  return false;
}

/** Primary nav — category links plus directory, About, and Contact. */
export function HeaderNav({
  onNavigate,
  className = "",
  variant = "bar",
}: HeaderNavProps) {
  const pathname = usePathname();
  const items = isPalworldVerified()
    ? [...BASE_NAV, GAMES_NAV, ABOUT_NAV, CONTACT_NAV]
    : [...BASE_NAV, ABOUT_NAV, CONTACT_NAV];

  return (
    <nav
      aria-label="Main Navigation"
      className={
        variant === "stack"
          ? `flex flex-col items-stretch gap-1 ${className}`
          : `flex items-center gap-1 ${className}`
      }
    >
      {items.map((item) => {
        const active = isActive(item.match, pathname);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`${active ? linkActive : linkIdle} ${variant === "stack" ? "w-full" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
