"use client";

import { useCallback, useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/icon";
import { countdownParts } from "@/lib/utils";

/**
 * A ticking countdown.
 *
 * The clock is external state that the server cannot know, so it is read with
 * `useSyncExternalStore` rather than mirrored into `useState` from an effect:
 * the server snapshot is `null` (rendering nothing), the client subscribes to a
 * one-second tick, and React handles hydration without a mismatch or a
 * cascading re-render on mount.
 *
 * The snapshot is a plain number of seconds so it stays referentially stable
 * between reads — returning a fresh object each time would spin React forever.
 */
export function Countdown({
  target,
  prefix,
}: {
  target: string | null;
  prefix: string;
}) {
  const subscribe = useCallback((onChange: () => void) => {
    const id = setInterval(onChange, 1000);
    return () => clearInterval(id);
  }, []);

  const nowSeconds = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );

  // Not yet hydrated: reserve the line so the header doesn't jump when it fills.
  if (nowSeconds === null) return <span className="block h-5" />;

  const parts = countdownParts(target);
  if (!parts) return null;

  const segments = parts.days
    ? [`${parts.days}d`, `${parts.hours}h`, `${parts.minutes}m`]
    : parts.hours
      ? [`${parts.hours}h`, `${parts.minutes}m`, `${parts.seconds}s`]
      : [`${parts.minutes}m`, `${parts.seconds}s`];

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
      <Icon name="clock" size={15} />
      <span className="label !normal-case !tracking-normal !text-ink-soft">{prefix}</span>
      <span className="tnum">{segments.join(" ")}</span>
    </span>
  );
}
