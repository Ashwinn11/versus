CREATE TABLE "site_counters" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"total_visitors" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"voter_key" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen");--> statement-breakpoint
-- The counter is a single fixed row; seed it so the upsert path never has to
-- branch on "does the row exist yet".
INSERT INTO "site_counters" ("id", "total_visitors") VALUES (1, 0)
ON CONFLICT ("id") DO NOTHING;
