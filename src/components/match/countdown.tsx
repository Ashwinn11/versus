"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { countdownParts } from "@/lib/utils";

/**
 * Ticking countdown. Rendered only after mount: a server-rendered clock is
 * wrong the instant it reaches the browser, and hydrating over it trips a
 * mismatch warning on every load.
 */
export function Countdown({
  target,
  prefix,
}: {
  target: string | null;
  prefix: string;
}) {
  const [parts, setParts] = useState<ReturnType<typeof countdownParts>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setParts(countdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) return <span className="h-5" />;
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
