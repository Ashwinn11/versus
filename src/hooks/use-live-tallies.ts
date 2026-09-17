"use client";

import { useEffect, useRef, useState } from "react";

export type Tallies = { a: number; b: number; total: number };

/**
 * Live tallies over SSE, falling back to polling.
 *
 * Two rules matter here:
 *
 * 1. A local optimistic vote always wins over an incoming server frame until
 *    the server confirms it. Otherwise the poller lands between your click and
 *    the write completing, and your own vote visibly flickers away.
 * 2. SSE is not assumed to work. Corporate proxies, some mobile networks and
 *    a few browser extensions kill event streams silently, so two consecutive
 *    failures switch to polling for the rest of the session.
 */
export function useLiveTallies(
  slug: string,
  initial: Tallies,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [tallies, setTallies] = useState<Tallies>(initial);
  const [connected, setConnected] = useState(false);
  /** Set while a local vote is in flight; server frames are ignored until it clears. */
  const pendingLocal = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let failures = 0;

    const apply = (next: Tallies) => {
      if (cancelled || pendingLocal.current) return;
      setTallies(next);
    };

    const startPolling = () => {
      if (pollTimer || cancelled) return;
      setConnected(false);
      const tick = async () => {
        try {
          const res = await fetch(`/api/matches/${slug}/tallies`, {
            cache: "no-store",
          });
          if (res.ok) apply((await res.json()) as Tallies);
        } catch {
          // Offline or a blip; the next tick tries again.
        }
      };
      void tick();
      pollTimer = setInterval(tick, 3000);
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(`/api/matches/${slug}/stream`);

      source.addEventListener("open", () => {
        failures = 0;
        setConnected(true);
      });

      source.addEventListener("tallies", (event) => {
        try {
          apply(JSON.parse((event as MessageEvent).data) as Tallies);
        } catch {
          // Ignore a malformed frame rather than tearing down the stream.
        }
      });

      source.addEventListener("error", () => {
        setConnected(false);
        failures += 1;
        // EventSource retries on its own once; a second failure means the
        // transport is blocked rather than merely interrupted.
        if (failures >= 2) {
          source?.close();
          source = null;
          startPolling();
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [slug, enabled]);

  /** Apply a vote locally and hold off server frames until it settles. */
  function applyLocal(next: Tallies) {
    pendingLocal.current = true;
    setTallies(next);
  }

  function settleLocal(next?: Tallies) {
    if (next) setTallies(next);
    pendingLocal.current = false;
  }

  return { tallies, connected, applyLocal, settleLocal };
}
