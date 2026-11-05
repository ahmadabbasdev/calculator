/**
 * Site owner / contact fields for trust pages.
 * Replace each token below (owner name, location, etc.) before a production deploy.
 * scripts/check-placeholders.mjs fails production builds if any brace-tokens remain.
 */

export const OWNER_NAME = "{{OWNER_NAME}}";
export const OWNER_LOCATION = "{{OWNER_LOCATION}}";
/** Two to four sentences in the owner's own words. */
export const WHY_I_BUILT_THIS = "{{WHY_I_BUILT_THIS}}";
/** Optional public photo URL or path; leave the placeholder to hide the photo. */
export const OWNER_PHOTO = "{{OWNER_PHOTO}}";
export const CONTACT_EMAIL = "{{CONTACT_EMAIL}}";
export const RESPONSE_TIME = "{{RESPONSE_TIME}}";

export function hasOwnerPhoto(): boolean {
  return Boolean(OWNER_PHOTO) && !OWNER_PHOTO.includes("{{");
}
