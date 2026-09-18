import { z } from "zod";

/** Mirrors `Stat` in the schema. Values are 0-100 so both sides share a scale. */
export const statSchema = z.object({
  label: z.string().trim().min(1).max(18),
  value: z.number().int().min(0).max(100),
});

export const statsSchema = z.array(statSchema).max(6);

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a 6-digit hex value");

export const contenderInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  color: hexColor,
  imageUrl: z.url().max(500).optional().or(z.literal("")),
  stats: statsSchema.optional(),
});

export const createMatchSchema = z
  .object({
    // No separate title: the question IS the headline. A display title is
    // derived server-side as "<A> vs. <B>" for cards, metadata and OG.
    question: z.string().trim().min(3).max(160),
    /** One category for the whole match, not one per contender. */
    categorySlug: z.string().trim().min(1).max(40),
    a: contenderInputSchema,
    b: contenderInputSchema,
    /** Omitted means "start now". */
    startsAt: z.iso.datetime().optional(),
    endsAt: z.iso.datetime(),
  })
  .refine(
    (v) => new Date(v.endsAt) > new Date(v.startsAt ?? Date.now()),
    { message: "The match has to end after it starts", path: ["endsAt"] },
  )
  .refine((v) => v.a.color.toLowerCase() !== v.b.color.toLowerCase(), {
    message: "Both sides need different colours",
    path: ["b", "color"],
  });

export const voteSchema = z.object({
  matchContenderId: z.uuid(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type ContenderInput = z.infer<typeof contenderInputSchema>;
