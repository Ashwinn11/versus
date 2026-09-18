-- Removes four things that were modelled but never built:
--
--   * `tags` / `match_tags` — a second taxonomy alongside categories. Nothing
--     ever inserted a tag, so the /t/[tag] route could only ever 404.
--   * `match_contenders.answer` — a per-side one-line argument. No create-flow
--     field ever wrote it, so it is NULL on every row that has ever existed.
--   * `matches.decided_by` — its only non-'time' value, 'creator', was for an
--     end-my-match-early control that does not exist.
--   * the 'draft' match status — `createMatch` always sets 'live' or
--     'scheduled' explicitly, so no draft was ever creatable.

DROP TABLE "match_tags" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint

-- Reshaping an enum means recreating the type, and the column's default has to
-- come off first or it blocks the type change.
ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint

-- Defensive: no row should be 'draft', but the cast back to the new enum
-- aborts the whole migration if even one is, so normalise while it is still
-- free-form text.
UPDATE "matches" SET "status" = 'scheduled' WHERE "status" = 'draft';--> statement-breakpoint

DROP TYPE "public"."match_status";--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'ended');--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE "public"."match_status" USING "status"::"public"."match_status";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint

ALTER TABLE "match_contenders" DROP COLUMN "answer";--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "decided_by";--> statement-breakpoint
DROP TYPE "public"."decided_by";
