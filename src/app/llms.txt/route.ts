import { buildLlmsTxt } from "@/lib/calculators";
import {
  buildVerifiedStateLlmsLines,
  nestStateLinesUnderHub,
} from "@/lib/state-tax/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Serve /llms.txt from the calculator catalog plus nested state pages. */
export const dynamic = "force-static";

export function GET() {
  const catalog = buildLlmsTxt({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });
  const stateLines = buildVerifiedStateLlmsLines(SITE_URL);
  const body = nestStateLinesUnderHub(catalog, stateLines);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
