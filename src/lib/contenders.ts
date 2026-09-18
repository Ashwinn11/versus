import type { Stat } from "@/db/schema";

/**
 * A contender as the UI sees it.
 *
 * Contenders belong to one match, so there is nothing to resolve any more —
 * this is the row itself. The type stays because every card, bar and OG image
 * consumes it, and keeping the shape stable means the presentation layer never
 * had to care that the storage behind it changed.
 */
export type ResolvedContender = {
  /** `matchContenders.id` — what a vote is cast against. */
  id: string;
  side: "a" | "b";
  name: string;
  nickname: string | null;
  color: string;
  imageUrl: string | null;
  stats: Stat[];
  voteCount: number;
};

type Row = {
  id: string;
  side: "a" | "b";
  name: string;
  nickname: string | null;
  color: string;
  imageUrl: string | null;
  stats: Stat[] | null;
  voteCount: number;
};

export function toContender(row: Row): ResolvedContender {
  return { ...row, stats: row.stats ?? [] };
}

/**
 * Pairs the two sides' stats by label so the Tale of the Tape renders one row
 * per attribute. The create form drives both sides from one shared label list,
 * so these line up; an attribute somehow present on only one side still gets a
 * row, with the other reading zero, because hiding it would quietly
 * misrepresent the comparison.
 */
export function pairStats(a: Stat[], b: Stat[]) {
  const labels: string[] = [];
  for (const s of [...a, ...b]) {
    if (!labels.some((l) => l.toLowerCase() === s.label.toLowerCase())) {
      labels.push(s.label);
    }
  }
  return labels.map((label) => {
    const find = (list: Stat[]) =>
      list.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value ?? 0;
    return { label, a: find(a), b: find(b) };
  });
}
