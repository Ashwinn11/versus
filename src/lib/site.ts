/**
 * The site's public origin.
 *
 * Canonicals, sitemap entries and OG image URLs must all be absolute, so a
 * wrong value here silently breaks every link preview and tells search engines
 * the wrong address. Vercel sets VERCEL_PROJECT_PRODUCTION_URL on deployments,
 * which keeps previews from claiming to be production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Versus";
export const SITE_DESCRIPTION =
  "The internet's biggest arena. Two contenders, one question, and a crowd that decides. Vote live on anything versus anything.";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
