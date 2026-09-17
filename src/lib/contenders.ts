import type { Stat } from "@/db/schema";
import { DEFAULT_COLOR_A } from "./palette";

type RosterEntry = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  defaultNickname: string | null;
  defaultColor: string | null;
  defaultStats: Stat[] | null;
};

type Appearance = {
  id: string;
  side: "a" | "b";
  nickname: string | null;
  color: string | null;
  imageUrl: string | null;
  stats: Stat[] | null;
  answer: string | null;
  voteCount: number;
};

/**
 * A contender as the UI sees it: every field already resolved, nothing
 * nullable that a component would have to fall back on.
 */
export type ResolvedContender = {
  /** `matchContenders.id` — what a vote is cast against. */
  id: string;
  contenderId: string;
  slug: string;
  side: "a" | "b";
  name: string;
  nickname: string | null;
  color: string;
  imageUrl: string | null;
  stats: Stat[];
  answer: string | null;
  voteCount: number;
};

/**
 * Collapses "override, else roster default" into one flat object. This is the
 * ONLY place that rule is expressed — components never see a null that means
 * "look somewhere else", which is what keeps the override model from leaking
 * into every card, bar and OG image.
 */
export function resolveContender(
  appearance: Appearance,
  roster: RosterEntry,
): ResolvedContender {
  return {
    id: appearance.id,
    contenderId: roster.id,
    slug: roster.slug,
    side: appearance.side,
    name: roster.name,
    nickname: appearance.nickname ?? roster.defaultNickname,
    color: appearance.color ?? roster.defaultColor ?? DEFAULT_COLOR_A,
    imageUrl: appearance.imageUrl ?? roster.imageUrl,
    stats: appearance.stats ?? roster.defaultStats ?? [],
    answer: appearance.answer,
    voteCount: appearance.voteCount,
  };
}

/**
 * Pairs the two sides' stats by label so the Tale of the Tape can render one
 * row per attribute. A label present on only one side still gets a row, with
 * the other side reading zero — hiding it would quietly misrepresent the
 * comparison.
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
