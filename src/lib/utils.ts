import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1200 → "1.2k". Keeps live counters from changing width as they climb. */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
  }
  const m = n / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}m`;
}

/**
 * Vote split as whole percentages that always total exactly 100 — naive
 * rounding on both sides produces "49% / 50%", which reads as a bug on a card
 * whose entire job is showing a split.
 */
export function splitPercentages(a: number, b: number): [number, number] {
  const total = a + b;
  if (total === 0) return [50, 50];
  const pctA = Math.round((a / total) * 100);
  return [pctA, 100 - pctA];
}

export function formatRelative(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60_000, "second"],
    [3_600_000, "minute"],
    [86_400_000, "hour"],
    [604_800_000, "day"],
    [2_629_800_000, "week"],
    [31_557_600_000, "month"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [limit, unit] of units) {
    if (abs < limit) {
      const divisor =
        unit === "second"
          ? 1000
          : unit === "minute"
            ? 60_000
            : unit === "hour"
              ? 3_600_000
              : unit === "day"
                ? 86_400_000
                : unit === "week"
                  ? 604_800_000
                  : 2_629_800_000;
      return rtf.format(Math.round(diff / divisor), unit);
    }
  }
  return rtf.format(Math.round(diff / 31_557_600_000), "year");
}

/** Countdown split into parts, for a timer that never reflows. */
export function countdownParts(target: Date | string | null) {
  if (!target) return null;
  const t = typeof target === "string" ? new Date(target) : target;
  const ms = t.getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
