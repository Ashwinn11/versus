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
  "draft",
  "scheduled",
  "live",
  "ended",
]);
export const contenderSide = pgEnum("contender_side", ["a", "b"]);
export const decidedBy = pgEnum("decided_by", ["time", "creator"]);

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
 * surface, and letting it grow unbounded is what turns it into tag soup. The
 * open-ended half of the taxonomy lives in `tags` instead.
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Key into the icon set in `components/ui/icon.tsx`, never a glyph. */
  icon: text("icon").notNull(),
  accentColor: text("accent_color").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  /** `crossover` is assigned by the system when the two sides disagree; it is
   *  never offered as a choice in the create flow. */
  isSystem: boolean("is_system").default(false).notNull(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
  },
  (t) => [index("tags_usage_idx").on(t.usageCount.desc())],
);

/* -------------------------------------------------------------------------- */
/*  Roster                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The reusable half of a contender: who they are across every match they ever
 * appear in, plus the lifetime record that makes the Hall of Fame worth
 * reading. Anything that changes per matchup lives on `matchContenders`.
 */
export const contenders = pgTable(
  "contenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    defaultNickname: text("default_nickname"),
    defaultColor: text("default_color"),
    defaultStats: jsonb("default_stats").$type<Stat[]>(),
    /** Nullable on purpose: some things genuinely resist classification, and
     *  forcing a pick is friction on the flow that most needs to feel easy. */
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    draws: integer("draws").default(0).notNull(),
    totalVotes: integer("total_votes").default(0).notNull(),
    matchCount: integer("match_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("contenders_category_votes_idx").on(
      t.categoryId,
      t.totalVotes.desc(),
    ),
    index("contenders_name_idx").on(t.name),
  ],
);

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
    status: matchStatus("status").default("draft").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    isMainEvent: boolean("is_main_event").default(false).notNull(),
    featuredRank: integer("featured_rank"),
    totalVotes: integer("total_votes").default(0).notNull(),
    winnerMatchContenderId: uuid("winner_match_contender_id"),
    decidedBy: decidedBy("decided_by"),
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
 * The per-matchup half of a contender. Every override column is nullable and
 * means "inherit from the roster entry" — `resolveContender()` is the only
 * place that rule is expressed, so no component has to know about it.
 */
export const matchContenders = pgTable(
  "match_contenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    contenderId: uuid("contender_id")
      .notNull()
      .references(() => contenders.id, { onDelete: "restrict" }),
    side: contenderSide("side").notNull(),
    nickname: text("nickname"),
    color: text("color"),
    imageUrl: text("image_url"),
    stats: jsonb("stats").$type<Stat[]>(),
    /** This side's answer to `matches.question`. */
    answer: text("answer"),
    voteCount: integer("vote_count").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("match_contenders_side_uq").on(t.matchId, t.side),
    uniqueIndex("match_contenders_entrant_uq").on(t.matchId, t.contenderId),
  ],
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

export const matchTags = pgTable(
  "match_tags",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.tagId] }),
    index("match_tags_lookup_idx").on(t.tagId, t.matchId),
  ],
);

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
  contenders: many(contenders),
  matchCategories: many(matchCategories),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  matchTags: many(matchTags),
}));

export const contendersRelations = relations(contenders, ({ one, many }) => ({
  category: one(categories, {
    fields: [contenders.categoryId],
    references: [categories.id],
  }),
  appearances: many(matchContenders),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  primaryCategory: one(categories, {
    fields: [matches.primaryCategoryId],
    references: [categories.id],
  }),
  creator: one(user, { fields: [matches.createdBy], references: [user.id] }),
  contenders: many(matchContenders),
  matchCategories: many(matchCategories),
  matchTags: many(matchTags),
}));

export const matchContendersRelations = relations(
  matchContenders,
  ({ one }) => ({
    match: one(matches, {
      fields: [matchContenders.matchId],
      references: [matches.id],
    }),
    contender: one(contenders, {
      fields: [matchContenders.contenderId],
      references: [contenders.id],
    }),
  }),
);

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

export const matchTagsRelations = relations(matchTags, ({ one }) => ({
  match: one(matches, {
    fields: [matchTags.matchId],
    references: [matches.id],
  }),
  tag: one(tags, { fields: [matchTags.tagId], references: [tags.id] }),
}));
