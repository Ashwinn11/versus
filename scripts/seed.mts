import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";

import * as s from "../src/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!), {
  schema: s,
});

/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { slug: "people", name: "People", icon: "people", accentColor: "#38bdf8" },
  { slug: "characters", name: "Characters", icon: "characters", accentColor: "#c084fc" },
  { slug: "animals", name: "Animals", icon: "animals", accentColor: "#84cc16" },
  { slug: "food", name: "Food & Drink", icon: "food", accentColor: "#fb923c" },
  { slug: "objects", name: "Objects", icon: "objects", accentColor: "#8d8378" },
  { slug: "tech", name: "Tech & Internet", icon: "tech", accentColor: "#2dd4bf" },
  { slug: "games", name: "Games", icon: "games", accentColor: "#6366f1" },
  { slug: "screen", name: "Movies & TV", icon: "screen", accentColor: "#f43f5e" },
  { slug: "music", name: "Music", icon: "music", accentColor: "#f472b6" },
  { slug: "sports", name: "Sports", icon: "sports", accentColor: "#facc15" },
  { slug: "places", name: "Places", icon: "places", accentColor: "#22d3ee" },
  { slug: "concepts", name: "Concepts", icon: "concepts", accentColor: "#a3e635" },
  { slug: "mythical", name: "Mythical", icon: "mythical", accentColor: "#fb7185" },
  { slug: "vehicles", name: "Vehicles", icon: "vehicles", accentColor: "#94a3b8" },
  { slug: "cursed", name: "Cursed", icon: "cursed", accentColor: "#a855f7" },
];

type C = {
  slug: string; name: string; cat: string;
  nick: string; color: string; stats: [string, number][];
};

// Deliberately spans the full absurdity range the product promises. If the
// cards hold up for "A Rock" next to "Cleopatra", they hold up for anything.
const CONTENDERS: C[] = [
  { slug: "a-rock", name: "A Rock", cat: "objects", nick: "The Silent Type", color: "#8d8378",
    stats: [["Durability", 100], ["Charisma", 2], ["Speed", 0], ["Loyalty", 88]] },
  { slug: "a-pigeon", name: "A Pigeon", cat: "animals", nick: "Sky Rat Supreme", color: "#94a3b8",
    stats: [["Audacity", 97], ["Navigation", 84], ["Hygiene", 11], ["Speed", 62]] },
  { slug: "monday", name: "Monday", cat: "concepts", nick: "The Inevitable", color: "#6366f1",
    stats: [["Dread", 99], ["Persistence", 100], ["Charm", 4], ["Speed", 31]] },
  { slug: "friday", name: "Friday", cat: "concepts", nick: "The Liberator", color: "#facc15",
    stats: [["Joy", 96], ["Productivity", 18], ["Charm", 92], ["Stamina", 40]] },
  { slug: "cleopatra", name: "Cleopatra", cat: "people", nick: "The Last Pharaoh", color: "#facc15",
    stats: [["Strategy", 95], ["Charisma", 98], ["Power", 88], ["Legacy", 99]] },
  { slug: "genghis-khan", name: "Genghis Khan", cat: "people", nick: "The Great Khan", color: "#f43f5e",
    stats: [["Strategy", 97], ["Power", 96], ["Charisma", 71], ["Legacy", 94]] },
  { slug: "a-goose", name: "A Goose", cat: "animals", nick: "Feathered Menace", color: "#f0abfc",
    stats: [["Aggression", 98], ["Fear Factor", 91], ["Speed", 58], ["Mercy", 0]] },
  { slug: "the-internet", name: "The Internet", cat: "tech", nick: "The Hive Mind", color: "#2dd4bf",
    stats: [["Reach", 100], ["Reliability", 62], ["Wisdom", 24], ["Speed", 95]] },
  { slug: "a-library", name: "A Library", cat: "places", nick: "The Quiet Archive", color: "#fb923c",
    stats: [["Wisdom", 96], ["Reach", 34], ["Reliability", 93], ["Speed", 12]] },
  { slug: "pizza", name: "Pizza", cat: "food", nick: "The Universal Peace Treaty", color: "#fb923c",
    stats: [["Comfort", 97], ["Versatility", 92], ["Nutrition", 41], ["Reheatability", 78]] },
  { slug: "tacos", name: "Tacos", cat: "food", nick: "Handheld Perfection", color: "#84cc16",
    stats: [["Comfort", 91], ["Versatility", 96], ["Nutrition", 58], ["Structural Integrity", 44]] },
  { slug: "coffee", name: "Coffee", cat: "food", nick: "Liquid Deadline", color: "#a16207",
    stats: [["Urgency", 98], ["Comfort", 84], ["Dependency", 95], ["Calm", 9]] },
  { slug: "tea", name: "Tea", cat: "food", nick: "The Patient One", color: "#84cc16",
    stats: [["Calm", 96], ["Comfort", 92], ["Urgency", 22], ["Ritual", 97]] },
  { slug: "dragons", name: "Dragons", cat: "mythical", nick: "The Hoarders", color: "#f43f5e",
    stats: [["Power", 97], ["Flight", 94], ["Greed", 99], ["Stealth", 12]] },
  { slug: "kraken", name: "The Kraken", cat: "mythical", nick: "Depth Charge", color: "#22d3ee",
    stats: [["Power", 93], ["Stealth", 81], ["Reach", 88], ["Flight", 0]] },
  { slug: "bigfoot", name: "Bigfoot", cat: "mythical", nick: "Camera-Shy", color: "#a16207",
    stats: [["Stealth", 99], ["Power", 74], ["Fame", 88], ["Photogenic", 3]] },
  { slug: "a-printer", name: "A Printer", cat: "objects", nick: "The Betrayer", color: "#f43f5e",
    stats: [["Rage Induced", 100], ["Reliability", 7], ["Noise", 92], ["Loyalty", 2]] },
  { slug: "a-stapler", name: "A Stapler", cat: "objects", nick: "Desk Warrior", color: "#78716c",
    stats: [["Reliability", 94], ["Rage Induced", 11], ["Noise", 38], ["Loyalty", 90]] },
  { slug: "cats", name: "Cats", cat: "animals", nick: "The Landlords", color: "#fb923c",
    stats: [["Independence", 98], ["Affection", 47], ["Chaos", 84], ["Stealth", 91]] },
  { slug: "dogs", name: "Dogs", cat: "animals", nick: "The Believers", color: "#facc15",
    stats: [["Loyalty", 100], ["Affection", 97], ["Chaos", 62], ["Stealth", 14]] },
  { slug: "sleep", name: "Sleep", cat: "concepts", nick: "The Undefeated", color: "#6366f1",
    stats: [["Necessity", 100], ["Pleasure", 93], ["Productivity", 8], ["Availability", 44]] },
  { slug: "money", name: "Money", cat: "concepts", nick: "The Motivator", color: "#84cc16",
    stats: [["Influence", 97], ["Happiness", 52], ["Necessity", 88], ["Permanence", 39]] },
  { slug: "love", name: "Love", cat: "concepts", nick: "The Wildcard", color: "#f472b6",
    stats: [["Influence", 94], ["Happiness", 91], ["Predictability", 6], ["Permanence", 58]] },
  { slug: "chaos", name: "Chaos", cat: "concepts", nick: "The Unscripted", color: "#a855f7",
    stats: [["Influence", 88], ["Predictability", 0], ["Energy", 99], ["Comfort", 9]] },
  { slug: "order", name: "Order", cat: "concepts", nick: "The Blueprint", color: "#38bdf8",
    stats: [["Influence", 85], ["Predictability", 99], ["Energy", 41], ["Comfort", 82]] },
  { slug: "a-bicycle", name: "A Bicycle", cat: "vehicles", nick: "The Honest Machine", color: "#2dd4bf",
    stats: [["Efficiency", 96], ["Speed", 44], ["Cost", 12], ["Joy", 89]] },
  { slug: "a-shopping-trolley", name: "A Shopping Trolley", cat: "vehicles", nick: "Four Bad Wheels", color: "#94a3b8",
    stats: [["Efficiency", 31], ["Speed", 22], ["Cost", 4], ["Chaos", 87]] },
  { slug: "wifi", name: "Wi-Fi", cat: "tech", nick: "The Invisible Hand", color: "#38bdf8",
    stats: [["Necessity", 96], ["Reliability", 51], ["Range", 62], ["Patience Required", 88]] },
  { slug: "a-usb-cable", name: "A USB Cable", cat: "tech", nick: "Wrong Way Round", color: "#c084fc",
    stats: [["Necessity", 84], ["Reliability", 72], ["Orientation Luck", 8], ["Tangling", 99]] },
  { slug: "a-microwave", name: "A Microwave", cat: "objects", nick: "The Impatient Chef", color: "#facc15",
    stats: [["Speed", 92], ["Precision", 21], ["Necessity", 78], ["Noise", 71]] },
  { slug: "socks", name: "Socks", cat: "objects", nick: "Always One Short", color: "#f472b6",
    stats: [["Comfort", 86], ["Reliability", 44], ["Disappearance", 97], ["Necessity", 81]] },
  { slug: "the-moon", name: "The Moon", cat: "places", nick: "Night Shift", color: "#7c8aa5",
    stats: [["Influence", 88], ["Mystery", 92], ["Reach", 74], ["Warmth", 3]] },
  { slug: "the-sun", name: "The Sun", cat: "places", nick: "The Big One", color: "#facc15",
    stats: [["Influence", 100], ["Warmth", 100], ["Mystery", 41], ["Subtlety", 0]] },
];

const MATCHES = [
  { slug: "coffee-vs-tea", title: "Coffee vs. Tea", q: "Which one actually gets you through the day?",
    a: "coffee", b: "tea", cats: ["food"], tags: ["breakfast", "daily-ritual"],
    aAns: "I don't ask you to relax. I ask you to perform.",
    bAns: "I've watched empires rise over me. I can wait.",
    status: "live", mainEvent: true, votesA: 1847, votesB: 1612, endsInHours: 26 },
  { slug: "a-rock-vs-a-printer", title: "A Rock vs. A Printer", q: "Which one is more reliable?",
    a: "a-rock", b: "a-printer", cats: ["objects"], tags: ["cursed", "office"],
    aAns: "I have never once jammed.", bAns: "PC LOAD LETTER.",
    status: "live", votesA: 1204, votesB: 88, endsInHours: 9 },
  { slug: "cats-vs-dogs", title: "Cats vs. Dogs", q: "Who deserves the crown?",
    a: "cats", b: "dogs", cats: ["animals"], tags: ["eternal-debate"],
    aAns: "I allow you to live here.", bAns: "YOU'RE HOME YOU'RE HOME YOU'RE HOME",
    status: "live", votesA: 2933, votesB: 3117, endsInHours: 47 },
  { slug: "a-goose-vs-genghis-khan", title: "A Goose vs. Genghis Khan", q: "Who wins in a fight, no weapons?",
    a: "a-goose", b: "genghis-khan", cats: ["animals", "people"], tags: ["cursed", "would-win"],
    aAns: "HONK.", bAns: "I have conquered continents. It is a bird.",
    status: "live", votesA: 921, votesB: 744, endsInHours: 3 },
  { slug: "sleep-vs-money", title: "Sleep vs. Money", q: "If you could only have one, forever?",
    a: "sleep", b: "money", cats: ["concepts"], tags: ["would-win", "existential"],
    aAns: "You cannot outrun me. You have tried.", bAns: "I can buy a very good mattress.",
    status: "live", votesA: 1456, votesB: 1502, endsInHours: 71 },
  { slug: "the-internet-vs-a-library", title: "The Internet vs. A Library", q: "Where would you rather find the truth?",
    a: "the-internet", b: "a-library", cats: ["tech", "places"], tags: ["knowledge"],
    aAns: "Everything, instantly, mostly wrong.", bAns: "Less, slower, checked.",
    status: "live", votesA: 688, votesB: 1013, endsInHours: 15 },
  { slug: "pizza-vs-tacos", title: "Pizza vs. Tacos", q: "Last meal on earth. Choose.",
    a: "pizza", b: "tacos", cats: ["food"], tags: ["breakfast"],
    aAns: "I am a circle of peace.", bAns: "I am a fold of joy.",
    status: "scheduled", votesA: 0, votesB: 0, startsInHours: 6, endsInHours: 54 },
  { slug: "dragons-vs-the-kraken", title: "Dragons vs. The Kraken", q: "Sky or sea — who rules?",
    a: "dragons", b: "kraken", cats: ["mythical"], tags: ["would-win"],
    aAns: "I will simply fly.", bAns: "Then land. I'll wait.",
    status: "scheduled", votesA: 0, votesB: 0, startsInHours: 20, endsInHours: 92 },
  { slug: "monday-vs-friday", title: "Monday vs. Friday", q: "Which one owns your mood?",
    a: "monday", b: "friday", cats: ["concepts"], tags: ["eternal-debate"],
    aAns: "I always come back.", bAns: "And I always save them from you.",
    status: "ended", votesA: 412, votesB: 3388, endedHoursAgo: 12 },
  { slug: "the-moon-vs-the-sun", title: "The Moon vs. The Sun", q: "Which one would you rather lose?",
    a: "the-moon", b: "the-sun", cats: ["places"], tags: ["existential"],
    aAns: "Lose me and you lose the tides.", bAns: "Lose me and you lose everything.",
    status: "ended", votesA: 1888, votesB: 2455, endedHoursAgo: 60 },
  { slug: "chaos-vs-order", title: "Chaos vs. Order", q: "Which one runs the universe?",
    a: "chaos", b: "order", cats: ["concepts"], tags: ["existential"],
    aAns: "Look around.", bAns: "Look closer.",
    status: "ended", votesA: 2201, votesB: 1974, endedHoursAgo: 120 },
  { slug: "wifi-vs-a-usb-cable", title: "Wi-Fi vs. A USB Cable", q: "Which has caused you more suffering?",
    a: "wifi", b: "a-usb-cable", cats: ["tech"], tags: ["cursed", "office"],
    aAns: "Connected. No internet.", bAns: "Flip me. Flip me again. Now flip back.",
    status: "ended", votesA: 1330, votesB: 1489, endedHoursAgo: 200 },
  { slug: "a-bicycle-vs-a-shopping-trolley", title: "A Bicycle vs. A Shopping Trolley", q: "Which is the superior vehicle?",
    a: "a-bicycle", b: "a-shopping-trolley", cats: ["vehicles"], tags: [],
    aAns: "I am freedom with gears.", bAns: "I contain snacks.",
    status: "live", votesA: 502, votesB: 611, endsInHours: 33 },
  { slug: "cleopatra-vs-a-pigeon", title: "Cleopatra vs. A Pigeon", q: "Who would win a staring contest?",
    a: "cleopatra", b: "a-pigeon", cats: ["people", "animals"], tags: ["cursed", "would-win"],
    aAns: "I have outmanoeuvred Rome.", bAns: "I do not blink. I do not think.",
    status: "live", votesA: 733, votesB: 897, endsInHours: 55 },
  { slug: "love-vs-money", title: "Love vs. Money", q: "Be honest — which one are you chasing?",
    a: "love", b: "money", cats: ["concepts"], tags: ["existential", "eternal-debate"],
    aAns: "You'd die for me.", bAns: "You wake up for me.",
    status: "live", votesA: 1611, votesB: 1588, endsInHours: 120 },
  { slug: "socks-vs-a-microwave", title: "Socks vs. A Microwave", q: "Which household item is more essential?",
    a: "socks", b: "a-microwave", cats: ["objects"], tags: ["cursed"],
    aAns: "There are two of us. Usually.", bAns: "I make food hot in seconds.",
    status: "scheduled", votesA: 0, votesB: 0, startsInHours: 48, endsInHours: 120 },
  { slug: "bigfoot-vs-the-internet", title: "Bigfoot vs. The Internet", q: "Who is better at hiding?",
    a: "bigfoot", b: "the-internet", cats: ["mythical", "tech"], tags: ["would-win"],
    aAns: "Fifty years. Not one clear photo.", bAns: "I know where you live.",
    status: "ended", votesA: 1102, votesB: 1877, endedHoursAgo: 300 },
  { slug: "a-stapler-vs-a-rock", title: "A Stapler vs. A Rock", q: "Which is the better paperweight?",
    a: "a-stapler", b: "a-rock", cats: ["objects"], tags: ["office"],
    aAns: "I have a job already.", bAns: "This is my entire purpose.",
    status: "ended", votesA: 688, votesB: 1244, endedHoursAgo: 400 },
];

/* -------------------------------------------------------------------------- */

const hours = (n: number) => new Date(Date.now() + n * 3_600_000);

async function main() {
  console.log("clearing…");
  await db.execute(sql`
    truncate table ${s.votes}, ${s.matchTags}, ${s.matchCategories},
                   ${s.matchContenders}, ${s.matches}, ${s.contenders},
                   ${s.tags}, ${s.categories}
    restart identity cascade`);

  console.log("categories…");
  const cats = await db
    .insert(s.categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
    .returning();
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  console.log("contenders…");
  const rows = await db
    .insert(s.contenders)
    .values(
      CONTENDERS.map((c) => ({
        slug: c.slug,
        name: c.name,
        defaultNickname: c.nick,
        defaultColor: c.color,
        defaultStats: c.stats.map(([label, value]) => ({ label, value })),
        categoryId: catId.get(c.cat) ?? null,
      })),
    )
    .returning();
  const conId = new Map(rows.map((r) => [r.slug, r.id]));

  console.log("tags…");
  const tagSlugs = [...new Set(MATCHES.flatMap((m) => m.tags))];
  const tagRows = tagSlugs.length
    ? await db
        .insert(s.tags)
        .values(
          tagSlugs.map((t) => ({
            slug: t,
            label: t.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
            usageCount: MATCHES.filter((m) => m.tags.includes(t)).length,
          })),
        )
        .returning()
    : [];
  const tagId = new Map(tagRows.map((t) => [t.slug, t.id]));

  console.log("matches…");
  for (const m of MATCHES) {
    const primary = m.cats[0];

    const startsAt =
      m.status === "scheduled" ? hours(m.startsInHours!) : hours(-(m.endsInHours ?? 240) / 2);
    const endsAt =
      m.status === "ended" ? hours(-m.endedHoursAgo!) : hours(m.endsInHours ?? 24);

    const [match] = await db
      .insert(s.matches)
      .values({
        slug: m.slug,
        title: m.title,
        question: m.q,
        primaryCategoryId: catId.get(primary) ?? null,
        status: m.status as "live" | "scheduled" | "ended",
        startsAt,
        endsAt,
        endedAt: m.status === "ended" ? endsAt : null,
        decidedBy: m.status === "ended" ? "time" : null,
        isMainEvent: Boolean(m.mainEvent),
        featuredRank: m.mainEvent ? 1 : null,
        totalVotes: m.votesA + m.votesB,
      })
      .returning();

    const [ca, cb] = await db
      .insert(s.matchContenders)
      .values([
        {
          matchId: match.id, contenderId: conId.get(m.a)!, side: "a" as const,
          answer: m.aAns, voteCount: m.votesA,
        },
        {
          matchId: match.id, contenderId: conId.get(m.b)!, side: "b" as const,
          answer: m.bAns, voteCount: m.votesB,
        },
      ])
      .returning();

    await db.insert(s.matchCategories).values({
      matchId: match.id,
      categoryId: catId.get(primary)!,
      isPrimary: true,
    });

    if (m.tags.length) {
      await db.insert(s.matchTags).values(
        m.tags.map((t) => ({ matchId: match.id, tagId: tagId.get(t)! })),
      );
    }

    if (m.status === "ended") {
      const winner = m.votesA === m.votesB ? null : m.votesA > m.votesB ? ca : cb;
      await db
        .update(s.matches)
        .set({ winnerMatchContenderId: winner?.id ?? null })
        .where(eq(s.matches.id, match.id));

      // Lifetime records only mean something if they are kept in step with
      // results — the cron does this in production; the seed mirrors it.
      const [winSlug, loseSlug] = m.votesA > m.votesB ? [m.a, m.b] : [m.b, m.a];
      await db.update(s.contenders)
        .set({ wins: sql`${s.contenders.wins} + 1` })
        .where(eq(s.contenders.slug, winSlug));
      await db.update(s.contenders)
        .set({ losses: sql`${s.contenders.losses} + 1` })
        .where(eq(s.contenders.slug, loseSlug));
    }

    for (const [slug, v] of [[m.a, m.votesA], [m.b, m.votesB]] as const) {
      await db
        .update(s.contenders)
        .set({
          matchCount: sql`${s.contenders.matchCount} + 1`,
          totalVotes: sql`${s.contenders.totalVotes} + ${v}`,
        })
        .where(eq(s.contenders.slug, slug));
    }
  }

  const counts = await db.execute(sql`
    select
      (select count(*) from ${s.categories})::int categories,
      (select count(*) from ${s.contenders})::int contenders,
      (select count(*) from ${s.matches})::int matches,
      (select count(*) from ${s.matchCategories})::int match_categories,
      (select count(*) from ${s.tags})::int tags`);
  console.log("done:", counts.rows[0]);
}

await main();
