"use client";

import { useState } from "react";

import { ContenderCard } from "@/components/match/contender-card";
import { TugBar } from "@/components/match/seam";
import { VoteCountPill } from "@/components/match/vote-count-pill";
import { VersusMark } from "@/components/match/versus-mark";
import { Icon } from "@/components/ui/icon";
import { useLiveTallies } from "@/hooks/use-live-tallies";
import type { ResolvedContender } from "@/lib/contenders";
import { cn, splitPercentages } from "@/lib/utils";

type Props = {
  slug: string;
  a: ResolvedContender;
  b: ResolvedContender;
  status: "scheduled" | "live" | "ended";
  winnerId: string | null;
  /** The viewer's existing vote, if the server found one for their cookie. */
  initialVotedFor: string | null;
  /** Status and category pills, rendered beside the live vote count. */
  badges?: React.ReactNode;
  /** Title, question and countdown — server-rendered, slotted in below. */
  children?: React.ReactNode;
};

/**
 * The voting surface. Owns the one piece of genuinely interactive state in the
 * app, so it's the only client component on the match page — everything around
 * it stays server-rendered.
 */
export function VoteArena({
  slug,
  a,
  b,
  status,
  winnerId,
  initialVotedFor,
  badges,
  children,
}: Props) {
  const [votedFor, setVotedFor] = useState<string | null>(initialVotedFor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ended = status === "ended";
  const live = status === "live";

  const { tallies, applyLocal, settleLocal } = useLiveTallies(
    slug,
    { a: a.voteCount, b: b.voteCount, total: a.voteCount + b.voteCount },
    { enabled: live },
  );

  // Results stay hidden until you've committed — seeing the crowd first is
  // what turns a vote into a popularity echo.
  const revealed = Boolean(votedFor) || ended;
  const [pa, pb] = splitPercentages(tallies.a, tallies.b);

  async function vote(target: ResolvedContender) {
    if (!live || busy || votedFor) return;
    setBusy(true);
    setError(null);

    // Optimistic: move the numbers now, reconcile after. A vote that takes
    // 300ms to show feels broken on the one interaction this product exists
    // for. Votes are final, so there is no prior vote to subtract.
    const next = {
      a: tallies.a + (target.id === a.id ? 1 : 0),
      b: tallies.b + (target.id === b.id ? 1 : 0),
      total: tallies.total + 1,
    };
    applyLocal(next);
    setVotedFor(target.id);

    try {
      const res = await fetch(`/api/matches/${slug}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchContenderId: target.id }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "That didn't go through.");
      }

      const data = (await res.json()) as {
        outcome: "counted" | "already-voted";
        votedFor: string;
        a: number;
        b: number;
        total: number;
      };

      // The server may lock us to a different side than we clicked — someone
      // on this network already voted. Show the truth rather than our guess.
      setVotedFor(data.votedFor);
      settleLocal({ a: data.a, b: data.b, total: data.total });
      if (data.outcome === "already-voted" && data.votedFor !== target.id) {
        setError("A vote from your network is already counted on this match.");
      }
    } catch (err) {
      // Roll back completely, so a failed vote never leaves the card claiming
      // one the server never recorded.
      setVotedFor(null);
      settleLocal(tallies);
      setError(err instanceof Error ? err.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ["--c-a" as string]: a.color, ["--c-b" as string]: b.color }}>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {badges}
        <VoteCountPill total={tallies.total} />
      </div>

      {children}

      <div className="relative mx-auto mt-6 grid max-w-lg grid-cols-2 items-start gap-3 sm:gap-5">
        <Side
          contender={a}
          percentage={pa}
          revealed={revealed}
          voted={votedFor === a.id}
          otherVoted={Boolean(votedFor) && votedFor !== a.id}
          winner={ended && winnerId === a.id}
          live={live}
          busy={busy}
          tilt="l"
          onVote={() => vote(a)}
        />
        <Side
          contender={b}
          percentage={pb}
          revealed={revealed}
          voted={votedFor === b.id}
          otherVoted={Boolean(votedFor) && votedFor !== b.id}
          winner={ended && winnerId === b.id}
          live={live}
          busy={busy}
          tilt="r"
          onVote={() => vote(b)}
        />

        <div className="pointer-events-none absolute left-1/2 top-[30%] z-10 -translate-x-1/2 -translate-y-1/2">
          <VersusMark size={48} />
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-lg">
        <TugBar
          percentA={pa}
          revealed={revealed}
          colorA={a.color}
          colorB={b.color}
          thick
        />

        <div className="mt-3 flex items-center justify-center text-sm">
          {error ? (
            <span className="font-semibold text-berry">{error}</span>
          ) : !revealed ? (
            <span className="font-semibold text-ink-soft">
              Vote to see where the crowd stands — your pick is final
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Side({
  contender,
  percentage,
  revealed,
  voted,
  otherVoted,
  winner,
  live,
  busy,
  tilt,
  onVote,
}: {
  contender: ResolvedContender;
  percentage: number;
  revealed: boolean;
  voted: boolean;
  otherVoted: boolean;
  winner: boolean;
  live: boolean;
  busy: boolean;
  tilt: "l" | "r";
  onVote: () => void;
}) {
  return (
    <ContenderCard
      contender={contender}
      percentage={percentage}
      revealed={revealed}
      isVoted={voted}
      isWinner={winner}
      size="card"
      tilt={tilt}
      className={voted ? "ring-4 ring-ink ring-offset-4 ring-offset-paper" : undefined}
      action={
        live ? (
          <button
            type="button"
            onClick={onVote}
            disabled={busy || voted || otherVoted}
            aria-label={`Vote for ${contender.name}`}
            className={cn(
              "press flex w-full items-center justify-center gap-2 rounded-pill px-4 py-3 text-sm font-bold",
              voted
                ? "bg-ink text-paper"
                : otherVoted
                  ? "cursor-not-allowed bg-tint text-ink-faint"
                  : "btn-accent",
              busy && "opacity-70",
            )}
          >
            {voted ? (
              <>
                <Icon name="check" size={16} strong />
                Your pick
              </>
            ) : otherVoted ? (
              "Vote cast"
            ) : (
              `Vote ${contender.name}`
            )}
          </button>
        ) : null
      }
    />
  );
}
