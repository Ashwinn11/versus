import { ImageResponse } from "next/og";

import { getMatchBySlug } from "@/db/queries/matches";
import { loadOgFonts } from "@/lib/og-fonts";
import { formatCount, splitPercentages } from "@/lib/utils";

export const alt = "A match on Versus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fdf8ef";
const INK = "#2b2118";
const MUTED = "#6b5a4a";

/**
 * The unfurl card.
 *
 * Deliberately carries no question and no title: the embed already shows both
 * as text right beside it, and repeating them wasted the half of the canvas
 * that should be showing the contest. This image's job is the part text
 * cannot do — two faces, their colours, and where the crowd stands.
 *
 * Satori supports a subset of CSS: flexbox only, no grid, and any element
 * with more than one child needs an explicit `display`.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [match, fonts] = await Promise.all([getMatchBySlug(slug), loadOgFonts()]);

  if (!match) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: PAPER,
            fontFamily: "Fraunces, serif",
            fontSize: 72,
            fontWeight: 700,
            color: INK,
          }}
        >
          Versus
        </div>
      ),
      { ...size, fonts },
    );
  }

  const [pa, pb] = splitPercentages(match.a.voteCount, match.b.voteCount);
  const ended = match.status === "ended";
  const winnerId = match.winnerMatchContenderId;
  const votes =
    match.totalVotes === 1 ? "1 vote" : `${formatCount(match.totalVotes)} votes`;

  return (
    new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: PAPER,
            padding: "40px 56px 44px",
            fontFamily: "Jakarta, sans-serif",
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 12,
                background: INK,
                color: PAPER,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              VS
            </div>
            <div
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 26,
                fontWeight: 700,
                color: INK,
              }}
            >
              Versus
            </div>

            <div style={{ display: "flex", marginLeft: "auto", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: MUTED }}>
                {votes}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: ended ? "#f0b545" : "#e8556d",
                  color: ended ? INK : "#ffffff",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 2,
                }}
              >
                {ended ? "FINAL" : "LIVE"}
              </div>
            </div>
          </div>

          {/* The contest, given the room the question used to waste */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
            }}
          >
            <Side c={match.a} pct={pa} won={ended && winnerId === match.a.id} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 76,
                height: 76,
                flexShrink: 0,
                borderRadius: 999,
                background: INK,
                color: PAPER,
                fontSize: 27,
                fontWeight: 800,
              }}
            >
              VS
            </div>

            <Side c={match.b} pct={pb} won={ended && winnerId === match.b.id} />
          </div>

          {/* The split, which the eye reads before any number */}
          <div
            style={{
              display: "flex",
              height: 20,
              borderRadius: 999,
              overflow: "hidden",
              background: "#ece2d4",
            }}
          >
            <div style={{ display: "flex", width: `${pa}%`, background: match.a.color }} />
            <div style={{ display: "flex", width: `${pb}%`, background: match.b.color }} />
          </div>
        </div>
      ),
      { ...size, fonts },
    )
  );
}

function Side({
  c,
  pct,
  won,
}: {
  c: { name: string; imageUrl: string | null; color: string; nickname: string | null };
  pct: number;
  won: boolean;
}) {
  const initials = c.name
    .replace(/^(a|an|the)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Square portrait, or initials on the contender's own colour — most
          contenders here genuinely have no photo. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 210,
          height: 210,
          borderRadius: 34,
          overflow: "hidden",
          background: c.color,
        }}
      >
        {c.imageUrl ? (
           
          <img src={c.imageUrl} alt="" width={210} height={210} style={{ objectFit: "cover" }} />
        ) : (
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces, serif",
              fontSize: 88,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {won && (
        <div
          style={{
            display: "flex",
            padding: "5px 14px",
            borderRadius: 999,
            background: "#f0b545",
            color: INK,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 1.5,
            marginTop: 14,
          }}
        >
          WINNER
        </div>
      )}

      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces, serif",
          fontSize: 40,
          fontWeight: 700,
          color: INK,
          marginTop: won ? 8 : 18,
        }}
      >
        {c.name.length > 16 ? `${c.name.slice(0, 16)}…` : c.name}
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces, serif",
          fontSize: 60,
          fontWeight: 700,
          color: c.color,
          marginTop: 2,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
