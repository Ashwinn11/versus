-- Baseline. Squashed from the original 0000-0003 on 2026-09-18.
--
-- The four migrations this replaces built up a schema and then tore parts of
-- it back down (a second `tags` taxonomy, a per-contender `answer`, a
-- `decided_by` column and a `draft` status, none of which were ever written
-- to). Replaying that argument on a fresh database served no purpose, so the
-- history was collapsed into the shape the code actually uses.
--
-- The reference-data inserts at the bottom are part of the migration on
-- purpose: the create form cannot function without categories, and the
-- visitor counter is a fixed single row the upsert path assumes exists. A
-- database that ran the DDL but not these is not a working database.

CREATE TYPE "public"."contender_side" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'ended');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"accent_color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "match_categories" (
	"match_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "match_categories_match_id_category_id_pk" PRIMARY KEY("match_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "match_contenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"side" "contender_side" NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"color" text NOT NULL,
	"image_url" text,
	"stats" jsonb,
	"vote_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"question" text NOT NULL,
	"primary_category_id" uuid,
	"created_by" text,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"is_main_event" boolean DEFAULT false NOT NULL,
	"featured_rank" integer,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"winner_match_contender_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site_counters" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"total_visitors" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"voter_key" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"match_contender_id" uuid NOT NULL,
	"voter_key" text NOT NULL,
	"user_id" text,
	"ip_hash" text,
	"ua_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_categories" ADD CONSTRAINT "match_categories_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_categories" ADD CONSTRAINT "match_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_contenders" ADD CONSTRAINT "match_contenders_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_match_contender_id_match_contenders_id_fk" FOREIGN KEY ("match_contender_id") REFERENCES "public"."match_contenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_categories_lookup_idx" ON "match_categories" USING btree ("category_id","match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_contenders_side_uq" ON "match_contenders" USING btree ("match_id","side");--> statement-breakpoint
CREATE INDEX "matches_status_starts_idx" ON "matches" USING btree ("status","starts_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "matches_lifecycle_idx" ON "matches" USING btree ("status","ends_at") WHERE "matches"."status" in ('scheduled', 'live');--> statement-breakpoint
CREATE INDEX "matches_main_event_idx" ON "matches" USING btree ("is_main_event","featured_rank") WHERE "matches"."is_main_event" = true;--> statement-breakpoint
CREATE INDEX "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_voter_uq" ON "votes" USING btree ("match_id","voter_key");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_ip_uq" ON "votes" USING btree ("match_id","ip_hash") WHERE "votes"."ip_hash" is not null;--> statement-breakpoint
CREATE INDEX "votes_match_contender_idx" ON "votes" USING btree ("match_contender_id");

--> statement-breakpoint
-- Categories are reference data, not content: the create form cannot function
-- without them, so a fresh deployment must have them from the first boot.
-- ON CONFLICT keeps this safe to re-run and lets a later migration adjust a
-- name or colour without fighting rows that already exist.
insert into "categories" ("slug", "name", "icon", "accent_color", "sort_order", "is_system") values
  ('people',     'People',          'people',     '#38bdf8',  0, false),
  ('characters', 'Characters',      'characters', '#c084fc',  1, false),
  ('animals',    'Animals',         'animals',    '#84cc16',  2, false),
  ('food',       'Food & Drink',    'food',       '#fb923c',  3, false),
  ('objects',    'Objects',         'objects',    '#8d8378',  4, false),
  ('tech',       'Tech & Internet', 'tech',       '#2dd4bf',  5, false),
  ('games',      'Games',           'games',      '#6366f1',  6, false),
  ('screen',     'Movies & TV',     'screen',     '#f43f5e',  7, false),
  ('music',      'Music',           'music',      '#f472b6',  8, false),
  ('sports',     'Sports',          'sports',     '#facc15',  9, false),
  ('places',     'Places',          'places',     '#22d3ee', 10, false),
  ('concepts',   'Concepts',        'concepts',   '#a3e635', 11, false),
  ('mythical',   'Mythical',        'mythical',   '#fb7185', 12, false),
  ('vehicles',   'Vehicles',        'vehicles',   '#94a3b8', 13, false),
  ('cursed',     'Cursed',          'cursed',     '#a855f7', 14, false)
on conflict ("slug") do update set
  "name" = excluded."name",
  "icon" = excluded."icon",
  "accent_color" = excluded."accent_color",
  "sort_order" = excluded."sort_order";
--> statement-breakpoint
-- The counter is a single fixed row; seed it so the upsert path never has to
-- branch on "does the row exist yet".
INSERT INTO "site_counters" ("id", "total_visitors") VALUES (1, 0)
ON CONFLICT ("id") DO NOTHING;
