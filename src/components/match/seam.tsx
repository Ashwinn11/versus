"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** Side A's share, 0-100. Drives where the rope sits. */
  percentA: number;
  revealed: boolean;
  colorA: string;
  colorB: string;
  thick?: boolean;
  className?: string;
};

/**
 * A tug-of-war rope rather than a progress bar. The marker in the middle is
 * the thing being pulled, and each vote drags it toward one side — so the
 * standings read as a contest in progress instead of a statistic.
 *
 * Before you've voted it sits dead centre: showing the crowd's answer first
 * would anchor yours.
 */
export function TugBar({
  percentA,
  revealed,
  colorA,
  colorB,
  thick,
  className,
}: Props) {
  const pos = revealed ? percentA : 50;

  return (
    <div
      className={cn("relative w-full select-none", thick ? "h-4" : "h-2.5", className)}
      style={
        { "--pos": `${pos}%`, "--c-a": colorA, "--c-b": colorB } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-pill bg-tint">
        <div
          className="fill-accent h-full transition-[width] duration-700 ease-out-quint"
          style={{ width: "var(--pos)", ["--card-accent" as string]: colorA }}
        />
        <div
          className="fill-accent h-full flex-1 transition-[width] duration-700 ease-out-quint"
          style={{ ["--card-accent" as string]: colorB }}
        />
      </div>

      {/* The knot being pulled. */}
      <div
        aria-hidden
        className={cn(
          "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card ring-2 ring-ink transition-[left] duration-700 ease-out-quint",
          thick ? "h-6 w-6" : "h-4 w-4",
        )}
        style={{ left: "var(--pos)" }}
      />
    </div>
  );
}
