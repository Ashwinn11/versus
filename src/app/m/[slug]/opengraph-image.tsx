import { ImageResponse } from "next/og";

import { getMatchBySlug } from "@/db/queries/matches";
import { splitPercentages } from "@/lib/utils";

export const alt = "A match on Versus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The unfurl card. This is the product's entire growth loop: a pasted link
 * that renders as a plain URL converts far worse than one showing two faces
 * and a live split, so this gets the same care as the page itself.
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
            background: "#fdf8ef",
            fontSize: 64,
            fontWeight: 700,
            color: "#2b2118",
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

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#fdf8ef",
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#2b2118",
              color: "#fdf8ef",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            VS
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#2b2118" }}>Versus</div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              padding: "8px 18px",
              borderRadius: 999,
              background: ended ? "#f0b545" : "#e8556d",
              color: ended ? "#2b2118" : "#ffffff",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {ended ? "FINAL" : "LIVE"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: match.title.length > 34 ? 60 : 76,
            fontWeight: 800,
            color: "#2b2118",
            marginTop: 30,
            lineHeight: 1.02,
          }}
        >
          {match.title}
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#6b5a4a", marginTop: 12 }}>
          {match.question.length > 78
            ? `${match.question.slice(0, 78)}…`
            : match.question}
        </div>

        {/* Both sides, sized by their share — the bar IS the story. */}
        <div style={{ display: "flex", marginTop: "auto", gap: 14 }}>
          <Panel name={match.a.name} pct={pa} color={match.a.color} align="flex-start" />
          <Panel name={match.b.name} pct={pb} color={match.b.color} align="flex-end" />
        </div>

        <div
          style={{
            display: "flex",
            height: 20,
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 18,
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

function Panel({
  name,
  pct,
  color,
  align,
}: {
  name: string;
  pct: number;
  color: string;
  align: "flex-start" | "flex-end";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#2b2118" }}>
        {name.length > 22 ? `${name.slice(0, 22)}…` : name}
      </div>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color }}>
        {pct}%
      </div>
    </div>
  );
}
