import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * A single bar in a contender's Tale of the Tape. Values are 0-100 on purpose:
 * the two sides are rendered as mirrored bars, so a shared scale is what makes
 * them visually comparable at a glance.
 */
export type Stat = { label: string; value: number };

export const matchStatus = pgEnum("match_status", [
  "scheduled",
  "live",
  "ended",
]);
export const contenderSide = pgEnum("contender_side", ["a", "b"]);

/* -------------------------------------------------------------------------- */
/*  Auth (better-auth owns these table shapes)                                 */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Curated and seeded, never user-created — the homepage tab bar is a design
 * surface, and letting it grow unbounded is what turns it into tag soup.
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Key into the icon set in `components/ui/icon.tsx`, never a glyph. */
  icon: text("icon").notNull(),
  accentColor: text("accent_color").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Matches                                                                    */
/* -------------------------------------------------------------------------- */

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Short, shareable, unguessable — this is what goes in a group chat. */
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    /** The one question both sides answer. */
    question: text("question").notNull(),
    /** Denormalized from `matchCategories.isPrimary` so rendering a card never
     *  needs the join table. */
    primaryCategoryId: uuid("primary_category_id").references(
      () => categories.id,
      { onDelete: "set null" },
    ),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    status: matchStatus("status").default("scheduled").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    isMainEvent: boolean("is_main_event").default(false).notNull(),
    featuredRank: integer("featured_rank"),
    totalVotes: integer("total_votes").default(0).notNull(),
    winnerMatchContenderId: uuid("winner_match_contender_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Feed ordering. Keyset pagination reads straight off this.
    index("matches_status_starts_idx").on(
      t.status,
      t.startsAt.desc(),
      t.id.desc(),
    ),
    // The cron sweep only ever cares about matches that can still transition,
    // so a partial index keeps it cheap no matter how big the archive gets.
    index("matches_lifecycle_idx")
      .on(t.status, t.endsAt)
      .where(sql`${t.status} in ('scheduled', 'live')`),
    index("matches_main_event_idx")
      .on(t.isMainEvent, t.featuredRank)
      .where(sql`${t.isMainEvent} = true`),
  ],
);

/**
 * A contender, belonging to exactly one match.
 *
 * There is no shared roster: every field here is the creator's choice for this
 * matchup alone. Two matches featuring "A Rock" hold two independent rows,
 * which is what lets each creator pick their own image, nickname and colour
 * without negotiating with anyone else's version.
 */
export const matchContenders = pgTable(
  "match_contenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    side: contenderSide("side").notNull(),
    name: text("name").notNull(),
    nickname: text("nickname"),
    color: text("color").notNull(),
    imageUrl: text("image_url"),
    stats: jsonb("stats").$type<Stat[]>(),
    voteCount: integer("vote_count").default(0).notNull(),
  },
  (t) => [uniqueIndex("match_contenders_side_uq").on(t.matchId, t.side)],
);

/* -------------------------------------------------------------------------- */
/*  Taxonomy joins                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A match lives in several categories at once. "A rock vs. a CEO" belongs in
 * Objects *and* People *and* Crossover, and should be discoverable from all
 * three — a single FK would force us to pick one and lose the other two.
 */
export const matchCategories = pgTable(
  "match_categories",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.categoryId] }),
    index("match_categories_lookup_idx").on(t.categoryId, t.matchId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Presence                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One row per anonymous visitor, keyed by the same signed cookie that dedupes
 * votes — so presence costs no new identifier and no new consent surface.
 *
 * `lastSeen` is refreshed by a heartbeat; "online now" counts rows inside a
 * short window. The index makes that count proportional to the number of
 * people currently on the site rather than to everyone who ever visited.
 */
export const visitors = pgTable(
  "visitors",
  {
    voterKey: text("voter_key").primaryKey(),
    firstSeen: timestamp("first_seen", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("visitors_last_seen_idx").on(t.lastSeen)],
);

/**
 * Single-row counter table.
 *
 * Total visitors is deliberately NOT `count(*)` over `visitors`: that scans
 * every row ever created, so the header would get slower every day the site
 * succeeded. Incrementing on first sight keeps the read O(1) forever.
 */
export const siteCounters = pgTable("site_counters", {
  id: integer("id").primaryKey().default(1),
  totalVisitors: integer("total_visitors").default(0).notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Votes                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One row per voter per match. The unique index is the dedupe mechanism — it
 * is enforced by the database rather than by a read-then-write in app code,
 * which under concurrent votes would let duplicates through.
 *
 * `ipHash`/`uaHash` are salted hashes kept only for abuse forensics; raw IPs
 * are never stored.
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    matchContenderId: uuid("match_contender_id")
      .notNull()
      .references(() => matchContenders.id, { onDelete: "cascade" }),
    /** Derived from the signed `vs_vk` cookie. */
    voterKey: text("voter_key").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    ipHash: text("ip_hash"),
    uaHash: text("ua_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("votes_voter_uq").on(t.matchId, t.voterKey),
    // Second lock, on the network rather than the browser. Clearing cookies or
    // switching browser mints a new voter key, so the cookie alone cannot hold
    // one-person-one-vote; the IP is the only signal that survives both.
    //
    // The cost is real and deliberate: everyone behind a single NAT — an
    // office, a campus, a phone network — shares one vote per match.
    uniqueIndex("votes_ip_uq")
      .on(t.matchId, t.ipHash)
      .where(sql`${t.ipHash} is not null`),
    index("votes_match_contender_idx").on(t.matchContenderId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const categoriesRelations = relations(categories, ({ many }) => ({
  matchCategories: many(matchCategories),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  primaryCategory: one(categories, {
    fields: [matches.primaryCategoryId],
    references: [categories.id],
  }),
  creator: one(user, { fields: [matches.createdBy], references: [user.id] }),
  contenders: many(matchContenders),
  matchCategories: many(matchCategories),
}));

export const matchContendersRelations = relations(matchContenders, ({ one }) => ({
  match: one(matches, {
    fields: [matchContenders.matchId],
    references: [matches.id],
  }),
}));

export const matchCategoriesRelations = relations(
  matchCategories,
  ({ one }) => ({
    match: one(matches, {
      fields: [matchCategories.matchId],
      references: [matches.id],
    }),
    category: one(categories, {
      fields: [matchCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
