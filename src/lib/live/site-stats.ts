import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

export type SiteStats = { online: number; total: number };
type Subscriber = (s: SiteStats) => void;

/** How long after a heartbeat someone still counts as online. */
const ONLINE_WINDOW_SECONDS = 40;
/** How often the shared poller re-reads the counts. */
const POLL_MS = 3000;

const subscribers = new Set<Subscriber>();
let timer: ReturnType<typeof setInterval> | null = null;
let last: SiteStats | null = null;

/**
 * One poller per instance, fanned out to everyone connected to it.
 *
 * The naive version — each visitor polling on their own timer — costs two
 * aggregate queries per visitor per interval, so the database load grows with
 * the audience. This keeps it at one query every few seconds no matter how
 * many people are watching.
 */
async function poll() {
  try {
    const result = await db.execute(sql`
      select
        (select count(*) from visitors
          where last_seen > now() - make_interval(secs => ${ONLINE_WINDOW_SECONDS})
        )::int as online,
        (select total_visitors from site_counters where id = 1)::int as total`);
    const row = result.rows[0] as SiteStats | undefined;
    const next: SiteStats = { online: row?.online ?? 0, total: row?.total ?? 0 };

    // Only wake subscribers when something actually moved.
    if (last && last.online === next.online && last.total === next.total) return;
    last = next;
    for (const fn of subscribers) fn(next);
  } catch {
    // A transient error must not kill the interval; the next tick retries and
    // subscribers keep their previous numbers meanwhile.
  }
}

export function subscribeToStats(onChange: Subscriber) {
  subscribers.add(onChange);
  if (!timer) {
    timer = setInterval(() => void poll(), POLL_MS);
    void poll();
  }
  return () => {
    subscribers.delete(onChange);
    if (subscribers.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      last = null;
    }
  };
}

export function currentStats() {
  return last;
}

/**
 * Marks a visitor present. Returns true the first time we ever see them, which
 * is what increments the all-time counter.
 *
 * `xmax = 0` is true only for a genuinely inserted row — it distinguishes a new
 * visitor from a returning one without a second query.
 */
export async function touchVisitor(voterKey: string): Promise<boolean> {
  const result = await db.execute(sql`
    insert into visitors (voter_key, first_seen, last_seen)
    values (${voterKey}, now(), now())
    on conflict (voter_key) do update set last_seen = now()
    returning (xmax = 0) as is_new`);

  const isNew = Boolean(result.rows[0]?.is_new);
  if (isNew) {
    await db.execute(
      sql`update site_counters set total_visitors = total_visitors + 1 where id = 1`,
    );
  }
  return isNew;
}

/**
 * Pushes a visitor's last-seen into the past when their connection drops, so
 * the online count falls immediately on close rather than decaying over the
 * full window.
 */
export async function releaseVisitor(voterKey: string) {
  await db.execute(sql`
    update visitors
    set last_seen = now() - make_interval(secs => ${ONLINE_WINDOW_SECONDS + 5})
    where voter_key = ${voterKey}`);
}
