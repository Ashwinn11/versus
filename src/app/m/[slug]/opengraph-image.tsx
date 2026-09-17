import { ImageResponse } from "next/og";

import { getMatchBySlug } from "@/db/queries/matches";
import { splitPercentages } from "@/lib/utils";

export const alt = "A match on Versus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fdf8ef";
const INK = "#2b2118";
const MUTED = "#6b5a4a";

/**
 * The unfurl card — the product's entire growth loop.
 *
 * A pasted link that renders as a bare URL converts far worse than one showing
 * two faces, the question and the live split, so this gets the same care as
 * the page itself. Satori supports a subset of CSS: flexbox only, no grid, and
 * every element with more than one child needs an explicit `display`.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);

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
            fontSize: 64,
            fontWeight: 700,
            color: INK,
          }}
        >
          Versus
        </div>
      ),
      size,
    );
  }

  const [pa, pb] = splitPercentages(match.a.voteCount, match.b.voteCount);
  const ended = match.status === "ended";
  const winnerId = match.winnerMatchContenderId;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER,
          padding: "44px 56px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 13,
              background: INK,
              color: PAPER,
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            VS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: INK }}>Versus</div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              padding: "7px 16px",
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

        {/* The question is the headline — it is what someone is being asked. */}
        <div
          style={{
            display: "flex",
            fontSize: match.question.length > 52 ? 40 : 50,
            fontWeight: 800,
            color: INK,
            marginTop: 22,
            lineHeight: 1.12,
          }}
        >
          {match.question.length > 96
            ? `${match.question.slice(0, 96)}…`
            : match.question}
        </div>

        {/* Both contenders, face to face */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            marginTop: "auto",
          }}
        >
          <Side c={match.a} pct={pa} won={ended && winnerId === match.a.id} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 62,
              height: 62,
              flexShrink: 0,
              borderRadius: 999,
              background: INK,
              color: PAPER,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            VS
          </div>

          <Side c={match.b} pct={pb} won={ended && winnerId === match.b.id} right />
        </div>

        {/* The split, as a bar the eye reads before any number */}
        <div
          style={{
            display: "flex",
            height: 18,
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 22,
            background: "#ece2d4",
          }}
        >
          <div style={{ display: "flex", width: `${pa}%`, background: match.a.color }} />
          <div style={{ display: "flex", width: `${pb}%`, background: match.b.color }} />
        </div>
      </div>
    ),
    size,
  );
}

function Side({
  c,
  pct,
  won,
  right,
}: {
  c: { name: string; imageUrl: string | null; color: string; nickname: string | null };
  pct: number;
  won: boolean;
  right?: boolean;
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
        flex: 1,
        alignItems: "center",
        gap: 20,
        flexDirection: right ? "row-reverse" : "row",
      }}
    >
      {/* Square portrait. Falls back to initials on the contender's own colour,
          which most of them will use — "a rock" has no headshot. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 150,
          height: 150,
          flexShrink: 0,
          borderRadius: 26,
          overflow: "hidden",
          background: c.color,
        }}
      >
        {c.imageUrl ? (
           
          <img src={c.imageUrl} alt="" width={150} height={150} style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: "#ffffff" }}>
            {initials}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: right ? "flex-end" : "flex-start",
          minWidth: 0,
        }}
      >
        {won && (
          <div
            style={{
              display: "flex",
              padding: "4px 12px",
              borderRadius: 999,
              background: "#f0b545",
              color: INK,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            WINNER
          </div>
        )}
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: INK }}>
          {c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name}
        </div>
        {c.nickname && (
          <div style={{ display: "flex", fontSize: 18, color: MUTED, marginTop: 2 }}>
            {c.nickname.length > 24 ? `${c.nickname.slice(0, 24)}…` : c.nickname}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 800,
            color: c.color,
            marginTop: 4,
          }}
        >
          {pct}%
        </div>
      </div>
    </div>
  );
}
