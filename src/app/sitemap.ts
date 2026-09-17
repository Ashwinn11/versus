import { desc, eq, inArray } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { db } from "@/db";
import { categories, matches } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

/** Rebuilt hourly — matches are created and settled continuously. */
export const revalidate = 3600;

/**
 * Only live and ended matches are listed. A scheduled match has no votes and
 * nothing to read yet, so indexing it invites a thin-content page into search
 * results that will be stale by the time anyone clicks it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [matchRows, categoryRows] = await Promise.all([
    db
      .select({
        slug: matches.slug,
        updatedAt: matches.updatedAt,
        status: matches.status,
      })
      .from(matches)
      .where(inArray(matches.status, ["live", "ended"]))
      .orderBy(desc(matches.updatedAt))
      .limit(5000),
    db.select({ slug: categories.slug }).from(categories).where(eq(categories.isSystem, false)),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/hall-of-fame`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/upcoming`, lastModified: now, changeFrequency: "hourly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticPages,
    ...categoryRows.map((c) => ({
      url: `${SITE_URL}/c/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...matchRows.map((m) => ({
      url: `${SITE_URL}/m/${m.slug}`,
      lastModified: m.updatedAt,
      // A live match's numbers change constantly; a settled one never will.
      changeFrequency: m.status === "live" ? ("hourly" as const) : ("monthly" as const),
      priority: m.status === "live" ? 0.9 : 0.7,
    })),
  ];
}
