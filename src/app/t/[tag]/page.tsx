import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeedPage } from "@/components/feed/feed-page";
import { db } from "@/db";
import { tags } from "@/db/schema";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: PageProps<"/t/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function TagPage({ params }: PageProps<"/t/[tag]">) {
  const { tag } = await params;
  const [row] = await db.select().from(tags).where(eq(tags.slug, tag)).limit(1);
  if (!row) notFound();

  return (
    <FeedPage
      title={row.label}
      subtitle={`Matches tagged ${row.label.toLowerCase()}.`}
      icon="bolt"
      tagSlug={row.slug}
      showNav={false}
      empty={{ title: "No matches", body: "Nothing carries this tag yet." }}
    />
  );
}
