/**
 * Site owner / contact fields for trust pages (About, Contact, Privacy).
 * Override any value with NEXT_PUBLIC_* env vars on Vercel without editing this file.
 */

function env(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function defaultContactEmail(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) {
    try {
      return `hello@${new URL(site).hostname}`;
    } catch {
      /* fall through */
    }
  }
  return "hello@calcdaily.app";
}

export const OWNER_NAME = env("NEXT_PUBLIC_OWNER_NAME", "Ahmad");

export const OWNER_LOCATION = env("NEXT_PUBLIC_OWNER_LOCATION", "Pakistan");

/** Two to four sentences in the owner's own words. */
export const WHY_I_BUILT_THIS = env(
  "NEXT_PUBLIC_WHY_I_BUILT_THIS",
  "I built CalcDaily so people can run common date, finance, health, and math calculations in the browser without creating an account. Each tool is checked with automated tests, and sourced schedules (like state income tax) are verified before they go live.",
);

/** Optional public photo URL or path; leave empty to hide the photo. */
export const OWNER_PHOTO = env("NEXT_PUBLIC_OWNER_PHOTO", "");

export const CONTACT_EMAIL = env(
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "ahmadabbas7925@gmail.com",
);

export const RESPONSE_TIME = env(
  "NEXT_PUBLIC_RESPONSE_TIME",
  "within 2 business days",
);

export function hasOwnerPhoto(): boolean {
  if (!OWNER_PHOTO) return false;
  if (OWNER_PHOTO.includes("{{")) return false;
  if (OWNER_PHOTO === "null" || OWNER_PHOTO === "undefined") return false;
  return true;
}

/**
 * Optional short note for the Freelance Rate Calculator ("From my experience").
 * Leave empty to hide the section. Must not contain {{placeholders}}.
 */
export const FREELANCE_NOTE = env("NEXT_PUBLIC_FREELANCE_NOTE", "");

export function hasFreelanceNote(): boolean {
  if (!FREELANCE_NOTE) return false;
  if (FREELANCE_NOTE.includes("{{")) return false;
  if (FREELANCE_NOTE === "null" || FREELANCE_NOTE === "undefined") return false;
  return true;
}
