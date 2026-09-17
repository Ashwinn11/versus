import "server-only";

import { eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { txDb } from "@/db/tx";
import {
  categories,
  contenders,
  matchCategories,
  matchContenders,
  matches,
} from "@/db/schema";
import type { ContenderInput, CreateMatchInput } from "@/lib/validation/match";
import { isManagedImageUrl } from "@/lib/storage";
import { slugify } from "@/lib/utils";

/**
 * Creates a match and everything it hangs off, in one transaction — a match
 * that exists with only one contender, or with no categories, is unrenderable,
 * so partial success is worse than failure.
 */
export async function createMatch(input: CreateMatchInput, userId: string) {
  const db = txDb();

  return db.transaction(async (tx) => {
    const allCategories = await tx.select().from(categories);
    const bySlug = new Map(allCategories.map((c) => [c.slug, c]));

    // One category, chosen for the match. It also classifies any contender
    // being enrolled for the first time, so the roster stays browsable.
    const categoryId = bySlug.get(input.categorySlug)?.id ?? null;

    /** Reuses a roster entry when one was picked, otherwise enrols a new one. */
    async function resolveContender(side: ContenderInput) {
      if (side.contenderId) {
        const [existing] = await tx
          .select()
          .from(contenders)
          .where(eq(contenders.id, side.contenderId))
          .limit(1);
        if (existing) return existing;
      }

      // Slugs are globally unique, so a collision means someone already
      // enrolled this name — suffix rather than fail the whole creation.
      const base = slugify(side.name) || "contender";
      const taken = await tx
        .select({ slug: contenders.slug })
        .from(contenders)
        .where(sql`${contenders.slug} like ${`${base}%`}`);
      const slug = taken.some((t) => t.slug === base)
        ? `${base}-${nanoid(5).toLowerCase()}`
        : base;

      const [created] = await tx
        .insert(contenders)
        .values({
          slug,
          name: side.name,
          defaultNickname: side.nickname || null,
          defaultColor: side.color,
          // Never trust a client-supplied image host.
          imageUrl: isManagedImageUrl(side.imageUrl) ? side.imageUrl! : null,
          defaultStats: side.stats?.length ? side.stats : null,
          categoryId,
          createdBy: userId,
        })
        .returning();
      return created;
    }

    const [aRoster, bRoster] = await Promise.all([
      resolveContender(input.a),
      resolveContender(input.b),
    ]);

    if (aRoster.id === bRoster.id) {
      throw new Error("A contender can't fight itself");
    }

    // A match belongs to every category its sides come from. Two different
    // categories also makes it a Crossover — that is the whole point of the
    // taxonomy, and it is derived here rather than asked of the creator.
    const primaryId = categoryId;
    const categoryIds = categoryId ? [categoryId] : [];

    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const status = startsAt.getTime() <= Date.now() ? "live" : "scheduled";

    const [match] = await tx
      .insert(matches)
      .values({
        // Short and unguessable: this string is the shareable link.
        slug: `${slugify(`${aRoster.name} vs ${bRoster.name}`).slice(0, 40) || "match"}-${nanoid(6).toLowerCase()}`,
        // Derived, never typed: the creator writes one question, and the
        // matchup names itself from whoever is in it.
        title: `${aRoster.name} vs. ${bRoster.name}`,
        question: input.question,
        primaryCategoryId: primaryId,
        createdBy: userId,
        status,
        startsAt,
        endsAt: new Date(input.endsAt),
      })
      .returning();

    await tx.insert(matchContenders).values([
      {
        matchId: match.id,
        contenderId: aRoster.id,
        side: "a",
        nickname: input.a.nickname || null,
        color: input.a.color,
        imageUrl: isManagedImageUrl(input.a.imageUrl) ? input.a.imageUrl! : null,
        stats: input.a.stats?.length ? input.a.stats : null,
      },
      {
        matchId: match.id,
        contenderId: bRoster.id,
        side: "b",
        nickname: input.b.nickname || null,
        color: input.b.color,
        imageUrl: isManagedImageUrl(input.b.imageUrl) ? input.b.imageUrl! : null,
        stats: input.b.stats?.length ? input.b.stats : null,
      },
    ]);

    if (categoryIds.length) {
      await tx.insert(matchCategories).values(
        categoryIds.map((id) => ({
          matchId: match.id,
          categoryId: id,
          isPrimary: id === primaryId,
        })),
      );
    }


    await tx
      .update(contenders)
      .set({ matchCount: sql`${contenders.matchCount} + 1` })
      .where(inArray(contenders.id, [aRoster.id, bRoster.id]));

    return match;
  });
}
