import "server-only";

import { nanoid } from "nanoid";

import { txDb } from "@/db/tx";
import {
  categories,
  matchCategories,
  matchContenders,
  matches,
} from "@/db/schema";
import type { CreateMatchInput } from "@/lib/validation/match";
import { isManagedImageUrl } from "@/lib/storage";
import { slugify } from "@/lib/utils";

/**
 * Creates a match and its two contenders in one transaction — a match that
 * exists with only one side is unrenderable, so partial success is worse than
 * failure.
 *
 * Contenders belong to this match alone. There is no roster to look up or
 * reconcile against, so everything the creator typed is taken at face value.
 */
export async function createMatch(input: CreateMatchInput, userId: string) {
  const db = txDb();

  return db.transaction(async (tx) => {
    const allCategories = await tx.select().from(categories);
    const categoryId =
      allCategories.find((c) => c.slug === input.categorySlug)?.id ?? null;

    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const status = startsAt.getTime() <= Date.now() ? "live" : "scheduled";

    const [match] = await tx
      .insert(matches)
      .values({
        // Short and unguessable: this string is the shareable link.
        slug: `${slugify(`${input.a.name} vs ${input.b.name}`).slice(0, 40) || "match"}-${nanoid(6).toLowerCase()}`,
        // Derived, never typed: the creator writes one question, and the
        // matchup names itself from whoever is in it.
        title: `${input.a.name} vs. ${input.b.name}`,
        question: input.question,
        primaryCategoryId: categoryId,
        createdBy: userId,
        status,
        startsAt,
        endsAt: new Date(input.endsAt),
      })
      .returning();

    const side = (input_: CreateMatchInput["a"], s: "a" | "b") => ({
      matchId: match.id,
      side: s,
      name: input_.name,
      nickname: input_.nickname || null,
      color: input_.color,
      // Never trust a client-supplied image host: without this check a crafted
      // request could point a portrait at any third-party server.
      imageUrl: isManagedImageUrl(input_.imageUrl) ? input_.imageUrl! : null,
      stats: input_.stats?.length ? input_.stats : null,
    });

    await tx
      .insert(matchContenders)
      .values([side(input.a, "a"), side(input.b, "b")]);

    if (categoryId) {
      await tx.insert(matchCategories).values({
        matchId: match.id,
        categoryId,
        isPrimary: true,
      });
    }

    return match;
  });
}
