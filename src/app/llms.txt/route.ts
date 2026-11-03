import { buildLlmsTxt } from "@/lib/calculators";
import { buildVerifiedStateLlmsLines } from "@/lib/state-tax/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Build /llms.txt at build time from the calculator catalog + verified state pages. */
export const dynamic = "force-static";

export function GET() {
  const catalog = buildLlmsTxt({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });
  const stateLines = buildVerifiedStateLlmsLines(SITE_URL);
  const body =
    stateLines.length === 0
      ? catalog
      : `${catalog.trimEnd()}\n\n${stateLines.join("\n")}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
