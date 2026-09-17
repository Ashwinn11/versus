"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { formatCount } from "@/lib/utils";

type Stats = { online: number; total: number };

/**
 * Live site stats in the header.
 *
 * Driven by an SSE stream where the connection *is* the presence signal: being
 * connected is what marks you online, and the server pushes new counts the
 * moment they change rather than the client asking on a timer. Closing the tab
 * drops the count immediately.
 */
export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/presence/stream");

    source.addEventListener("stats", (event) => {
      try {
        setStats(JSON.parse((event as MessageEvent).data) as Stats);
      } catch {
        // Ignore a malformed frame rather than tearing down the stream.
      }
    });

    // EventSource reconnects on its own; nothing to do but keep the last
    // numbers on screen while it does.
    return () => source.close();
  }, []);

  // An empty box of the same footprint until the first frame arrives: showing
  // "0 online" on every load would be a lie, and rendering nothing at all
  // makes the rest of the header jump sideways when the numbers appear.
  if (!stats) return <div className="hidden h-8 md:block" />;

  return (
    <div
      className="hidden items-center gap-4 rounded-pill bg-sand/70 px-3.5 py-1.5 md:flex"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="flex items-center gap-1.5"
        title={`${stats.online} ${stats.online === 1 ? "person" : "people"} here right now`}
      >
        <span className="relative grid h-2 w-2 place-items-center">
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-leaf opacity-70" />
          <span className="relative h-2 w-2 rounded-full bg-leaf" />
        </span>
        <span className="tnum text-xs font-bold text-ink">
          {formatCount(stats.online)}
        </span>
        <span className="text-xs font-medium text-ink-faint">online</span>
      </span>

      <span className="h-3.5 w-px bg-rule-strong/60" aria-hidden />

      <span className="flex items-center gap-1.5" title="Visitors all time">
        <Icon name="people" size={13} className="text-ink-faint" />
        <span className="tnum text-xs font-bold text-ink">
          {formatCount(stats.total)}
        </span>
        <span className="text-xs font-medium text-ink-faint">visitors</span>
      </span>
    </div>
  );
}
