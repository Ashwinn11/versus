import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeedPage } from "@/components/feed/feed-page";
import { categoryIcon } from "@/components/ui/icon";
import { db } from "@/db";
import { categories } from "@/db/schema";

export const revalidate = 30;

async function getCategory(slug: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({
  params,
}: PageProps<"/c/[category]">): Promise<Metadata> {
  const { category } = await params;
  const row = await getCategory(category);
  if (!row) return { title: "Category not found" };
  return {
    title: row.name,
    description: `Every ${row.name} match in the arena.`,
    alternates: { canonical: `/c/${row.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/c/[category]">) {
  const { category } = await params;
  const row = await getCategory(category);
  if (!row) notFound();

  return (
    <FeedPage
      title={row.name}
      subtitle={`Every match with a ${row.name} contender in it.`}
      icon={categoryIcon(row.slug)}
      accent={row.accentColor}
      categorySlug={row.slug}
      empty={{
        title: "Nothing here yet",
        body: `No ${row.name} matches have been created. That is an opening.`,
      }}
    />
  );
}
