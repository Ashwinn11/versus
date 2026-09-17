import "server-only";

/**
 * Loads real brand fonts for OG image rendering.
 *
 * Satori (which renders these images) cannot parse woff2, and Google's CSS
 * API serves woff2 to any modern client. Asking with an ancient user-agent is
 * what gets a plain TTF back — there is no official endpoint for it.
 *
 * Results are cached on the module so a warm instance fetches each font once,
 * not once per image.
 */
const cache = new Map<string, ArrayBuffer | null>();

const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}`;
    const css = await fetch(cssUrl, { headers: { "User-Agent": LEGACY_UA } }).then((r) =>
      r.text(),
    );
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/)?.[1];
    if (!url) throw new Error("no truetype source");

    const data = await fetch(url).then((r) => r.arrayBuffer());
    cache.set(key, data);
    return data;
  } catch {
    // A missing font must never fail the image — the card still renders in a
    // system face, which is far better than a broken link preview.
    cache.set(key, null);
    return null;
  }
}

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
};

/** Fraunces for headlines, Plus Jakarta Sans for everything else. */
export async function loadOgFonts(): Promise<OgFont[]> {
  const [display, body, bodyBold] = await Promise.all([
    loadFont("Fraunces", 700),
    loadFont("Plus Jakarta Sans", 500),
    loadFont("Plus Jakarta Sans", 800),
  ]);

  const fonts: OgFont[] = [];
  if (display) fonts.push({ name: "Fraunces", data: display, weight: 700, style: "normal" });
  if (body) fonts.push({ name: "Jakarta", data: body, weight: 400, style: "normal" });
  if (bodyBold) fonts.push({ name: "Jakarta", data: bodyBold, weight: 800, style: "normal" });
  return fonts;
}
