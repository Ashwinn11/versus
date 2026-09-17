import "server-only";

import { getTallies } from "@/db/queries/matches";

export type Tallies = { a: number; b: number; total: number };
type Subscriber = (t: Tallies) => void;

type Watch = {
  timer: ReturnType<typeof setInterval>;
  subscribers: Set<Subscriber>;
  last: Tallies | null;
};

const POLL_MS = 1500;

/**
 * One poller per match per instance, fanned out to every viewer on it.
 *
 * The obvious implementation — each SSE connection polling on its own — turns
 * a thousand viewers into a thousand queries every 1.5s against a match whose
 * tallies are two integers. This keeps that at one query regardless of
 * audience size, which is the difference between the feature being cheap and
 * being the thing that takes the database down when a match goes viral.
 */
const watches = new Map<string, Watch>();

export function subscribe(
  matchId: string,
  onChange: Subscriber,
): { unsubscribe: () => void; current: Tallies | null } {
  let watch = watches.get(matchId);

  if (!watch) {
    const created: Watch = {
      subscribers: new Set(),
      last: null,
      timer: setInterval(() => void poll(matchId), POLL_MS),
    };
    watches.set(matchId, created);
    watch = created;
    // Prime immediately so the first subscriber isn't waiting a full tick.
    void poll(matchId);
  }

  watch.subscribers.add(onChange);

  return {
    current: watch.last,
    unsubscribe() {
      const w = watches.get(matchId);
      if (!w) return;
      w.subscribers.delete(onChange);
      // Last viewer left — stop querying for a match nobody is watching.
      if (w.subscribers.size === 0) {
        clearInterval(w.timer);
        watches.delete(matchId);
      }
    },
  };
}

async function poll(matchId: string) {
  const watch = watches.get(matchId);
  if (!watch) return;

  try {
    const next = await getTallies(matchId);
    // Only emit on an actual change: a quiet match should cost its viewers
    // nothing but the heartbeat.
    if (
      watch.last &&
      watch.last.a === next.a &&
      watch.last.b === next.b
    ) {
      return;
    }
    watch.last = next;
    for (const fn of watch.subscribers) fn(next);
  } catch {
    // A transient DB error must not kill the interval — the next tick retries,
    // and subscribers simply keep their previous numbers until it recovers.
  }
}
