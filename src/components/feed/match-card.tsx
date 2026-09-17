import Image from "next/image";
import Link from "next/link";

import { LiveBadge } from "@/components/match/live-badge";
import { TugBar } from "@/components/match/seam";
import { Icon, categoryIcon } from "@/components/ui/icon";
import type { MatchSummary } from "@/db/queries/matches";
import { cn, formatCount, splitPercentages } from "@/lib/utils";

/**
 * A match in a feed. Shows the split even before you've voted — in a list
 * you're browsing rather than deciding, and the standings are what make one
 * row worth opening. The match page itself withholds them until you commit.
 */
export function MatchCard({
  match,
  variant = "default",
  hideStatus,
}: {
  match: MatchSummary;
  /** `result` leads with the winner — for feeds that are entirely finals. */
  variant?: "default" | "result";
  /** Suppresses the status pill when every card in the feed shares it. */
  hideStatus?: boolean;
}) {
  const [pa, pb] = splitPercentages(match.a.voteCount, match.b.voteCount);
  const ended = match.status === "ended";
  const winner =
    ended && match.winnerMatchContenderId
      ? match.winnerMatchContenderId === match.a.id
        ? "a"
        : "b"
      : null;

  if (variant === "result" && winner) {
    const won = winner === "a" ? match.a : match.b;
    const lost = winner === "a" ? match.b : match.a;
    const wonPct = winner === "a" ? pa : pb;
    return (
      <ResultCard
        match={match}
        won={won}
        lost={lost}
        wonPct={wonPct}
        totalVotes={match.totalVotes}
      />
    );
  }

  return (
    <Link
      href={`/m/${match.slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-card card-shadow transition-[box-shadow,translate] duration-300 ease-out-quint hover:-translate-y-1 hover:card-shadow-lg"
      style={{ ["--c-a" as string]: match.a.color, ["--c-b" as string]: match.b.color }}
    >
      <div className="relative grid grid-cols-2 gap-2 p-2">
        <Portrait c={match.a} dim={Boolean(winner) && winner !== "a"} />
        <Portrait c={match.b} dim={Boolean(winner) && winner !== "b"} />

        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 -rotate-6 place-items-center rounded-full bg-ink text-[0.7rem] font-bold tracking-wide text-paper ring-4 ring-card">
          VS
        </span>

        {!hideStatus && (
          <div className="absolute left-3.5 top-3.5 z-10">
            {match.status === "live" ? (
              <LiveBadge />
            ) : match.status === "scheduled" ? (
              <Pill icon="clock" label="Soon" />
            ) : (
              <Pill icon="trophy" label="Final" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-1">
        <div>
          <h3 className="text-balance font-display text-xl leading-tight text-ink">
            {match.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-pretty text-sm leading-snug text-ink-soft">
            {match.question}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <TugBar percentA={pa} revealed colorA={match.a.color} colorB={match.b.color} />
          <div className="flex items-center justify-between text-xs">
            <span
              className="tnum text-accent font-bold"
              style={{ ["--card-accent" as string]: match.a.color }}
            >
              {pa}%
            </span>
            <span className="tnum font-medium text-ink-faint">
              {formatCount(match.totalVotes)} votes
            </span>
            <span
              className="tnum text-accent font-bold"
              style={{ ["--card-accent" as string]: match.b.color }}
            >
              {pb}%
            </span>
          </div>
        </div>

        {match.category && (
          <div className="flex items-center gap-1.5 border-t border-rule/70 pt-2.5">
            <Icon name={categoryIcon(match.category.slug)} size={14} style={{ color: match.category.accentColor }} />
            <span className="label">{match.category.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function Portrait({ c, dim }: { c: MatchSummary["a"]; dim: boolean }) {
  const initials = c.name
    .replace(/^(a|an|the)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-inner transition-opacity duration-300",
        dim && "opacity-45",
      )}
      style={{
        ["--card-accent" as string]: c.color,
        background:
          "linear-gradient(160deg, color-mix(in oklch, var(--card-accent) 30%, white), color-mix(in oklch, var(--card-accent) 10%, white))",
      }}
    >
      {c.imageUrl ? (
        <Image
          src={c.imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 45vw, 190px"
          className="img-edge object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
        />
      ) : (
        <span className="text-accent absolute inset-0 grid place-items-center font-display text-3xl font-bold">
          {initials}
        </span>
      )}
    </div>
  );
}

function Pill({ icon, label }: { icon: "clock" | "trophy"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-card/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
      <Icon name={icon} size={12} className="text-ink-faint" />
      <span className="label">{label}</span>
    </span>
  );
}

/**
 * A settled match. The result is the entire content here, so the winner gets
 * the portrait and the loser is reduced to a line of text — showing both sides
 * at equal weight buries the one fact a Hall of Fame exists to record.
 */
function ResultCard({
  match,
  won,
  lost,
  wonPct,
  totalVotes,
}: {
  match: MatchSummary;
  won: MatchSummary["a"];
  lost: MatchSummary["a"];
  wonPct: number;
  totalVotes: number;
}) {
  const initials = won.name
    .replace(/^(a|an|the)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/m/${match.slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-card card-shadow transition-[box-shadow,translate] duration-300 ease-out-quint hover:-translate-y-1 hover:card-shadow-lg"
      style={{ ["--card-accent" as string]: won.color }}
    >
      <div className="relative p-2">
        <div
          className="relative aspect-[16/10] overflow-hidden rounded-inner"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in oklch, var(--card-accent) 32%, white), color-mix(in oklch, var(--card-accent) 10%, white))",
          }}
        >
          {won.imageUrl ? (
            <Image
              src={won.imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 92vw, 380px"
              className="img-edge object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
            />
          ) : (
            <span className="text-accent absolute inset-0 grid place-items-center font-display text-5xl font-bold">
              {initials}
            </span>
          )}

        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
        <div>
          <h3 className="flex items-center gap-2 font-display text-2xl leading-tight text-ink">
            <Icon name="trophy" size={18} className="shrink-0 text-marigold-500" strong />
            <span className="min-w-0 truncate">{won.name}</span>
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            beat {lost.name} &middot;{" "}
            <span className="tnum font-bold text-ink">{wonPct}%</span>
          </p>
        </div>

        <p className="line-clamp-2 text-pretty text-sm leading-snug text-ink-faint">
          {match.question}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-rule/70 pt-2.5">
          {match.category ? (
            <span className="flex items-center gap-1.5">
              <Icon
                name={categoryIcon(match.category.slug)}
                size={14}
                style={{ color: match.category.accentColor }}
              />
              <span className="label">{match.category.name}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="tnum text-xs font-semibold text-ink-faint">
            {formatCount(totalVotes)} votes
          </span>
        </div>
      </div>
    </Link>
  );
}
