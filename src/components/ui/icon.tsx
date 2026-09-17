import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * One icon set, one stroke weight, one source of truth.
 *
 * Every icon draws with `currentColor` and inherits size from the wrapper, so
 * hover, active and disabled states come from CSS rather than from separate
 * assets. Stroke is 1.5 to sit correctly beside regular-weight text; the
 * `strong` variant bumps it to 2 for use beside semibold labels.
 *
 * These replace the emoji this taxonomy started with. Emoji render differently
 * on every platform, ignore `currentColor`, and cannot take a state — which
 * makes them impossible to use as real navigation.
 */

export type IconName =
  | "people" | "characters" | "animals" | "food" | "objects" | "tech"
  | "games" | "screen" | "music" | "sports" | "places" | "concepts"
  | "mythical" | "vehicles" | "cursed" | "crossover"
  | "live" | "clock" | "trophy" | "share" | "plus" | "check"
  | "chevron-right" | "chevron-down" | "arrow-right" | "close" | "search"
  | "google" | "bolt" | "flame";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strong?: boolean;
};

/* Paths are drawn on a 24x24 grid, stroked, no fills, round caps and joins. */
const PATHS: Record<IconName, React.ReactNode> = {
  /* --- Categories ---------------------------------------------------- */
  people: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  characters: (
    <>
      <path d="M12 3.5 14.4 9l5.6.5-4.3 3.9 1.3 5.6L12 16l-5 3 1.3-5.6L4 9.5 9.6 9Z" />
    </>
  ),
  animals: (
    <>
      <path d="M8.5 13.5c-1.9 1-2.5 2.6-1.8 4 .7 1.4 2.5 1.4 5.3 1.4s4.6 0 5.3-1.4c.7-1.4.1-3-1.8-4-1.3-.7-2.3-1.9-3.5-1.9s-2.2 1.2-3.5 1.9Z" />
      <circle cx="6" cy="8.5" r="1.8" />
      <circle cx="18" cy="8.5" r="1.8" />
      <circle cx="10" cy="5.5" r="1.8" />
      <circle cx="14" cy="5.5" r="1.8" />
    </>
  ),
  food: (
    <>
      <path d="M4 10h16l-1.4 8.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8Z" />
      <path d="M7 10a5 5 0 0 1 10 0" />
      <path d="M12 3v2" />
    </>
  ),
  objects: (
    <>
      <path d="m4.5 14.5 3.8-8.2a2 2 0 0 1 2.9-.9l6.6 4.2a2 2 0 0 1 .7 2.6l-2.7 5a2 2 0 0 1-2.2 1l-7.6-1.6a2 2 0 0 1-1.5-2.1Z" />
    </>
  ),
  tech: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  games: (
    <>
      <path d="M7.5 9h9a4.5 4.5 0 0 1 4.4 5.4l-.5 2.4A2.6 2.6 0 0 1 16 17.6L14.4 16H9.6L8 17.6a2.6 2.6 0 0 1-4.4-.8l-.5-2.4A4.5 4.5 0 0 1 7.5 9Z" />
      <path d="M7 12v2M6 13h2M16 12.5h.01M18 14.5h.01" />
    </>
  ),
  screen: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9h19M7 5 5 9M12 5l-2 4M17 5l-2 4" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  sports: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 7.6 10M17 5h2.5v1.5A3.5 3.5 0 0 1 16.4 10" />
      <path d="M12 13v4M9 20h6" />
    </>
  ),
  places: (
    <>
      <path d="M12 21s7-5.2 7-10.4A7 7 0 0 0 5 10.6C5 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </>
  ),
  concepts: (
    <>
      <path d="M12 4.5a4.5 4.5 0 0 0-4.3 5.8A4 4 0 0 0 9 18h6a4 4 0 0 0 1.3-7.7A4.5 4.5 0 0 0 12 4.5Z" />
      <path d="M10 21h4" />
    </>
  ),
  mythical: (
    <>
      <path d="M4 15c2-6 6-9 9-9 2 0 3 1 3 2.5S15 11 13.5 11" />
      <path d="M4 15c3 3 7 4 10 3 2.5-.8 4-2.5 4-2.5l2 3.5-4 1" />
      <path d="M9.5 7.5h.01" />
    </>
  ),
  vehicles: (
    <>
      <path d="M4 16v-3.2a2 2 0 0 1 .3-1.1l2-3.1A2 2 0 0 1 8 7.7h8a2 2 0 0 1 1.7.9l2 3.1a2 2 0 0 1 .3 1.1V16" />
      <path d="M3 16h18" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  cursed: (
    <>
      <path d="M12 3.5c-4.1 0-7 2.8-7 6.5 0 2.3 1 3.7 2 4.6.5.5.8 1 .8 1.7V18a2 2 0 0 0 2 2h4.4a2 2 0 0 0 2-2v-1.7c0-.7.3-1.2.8-1.7 1-.9 2-2.3 2-4.6 0-3.7-2.9-6.5-7-6.5Z" />
      <path d="M9.5 10.5h.01M14.5 10.5h.01M12 15v5" />
    </>
  ),
  crossover: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 1-6 14.5" />
      <path d="M12 7.5a4.5 4.5 0 1 0 3.2 7.7" />
      <path d="M6 18H3.5M6 18v2.5" />
    </>
  ),

  /* --- Interface ------------------------------------------------------ */
  live: <circle cx="12" cy="12" r="5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" />
      <path d="M12 14v3.5M8.5 20h7" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M6 12.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  "chevron-right": <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  "chevron-down": <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />,
  "arrow-right": <path d="M4 12h15m-5.5-5.5L19 12l-5.5 5.5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  bolt: <path d="M13.5 3 5 13.5h6L10.5 21 19 10.5h-6Z" />,
  flame: (
    <>
      <path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.9-3.4-5.7-3.4-9.4 0 0-2.3 1-3.1 3.6C10.3 7 9.6 5.5 9.6 5.5 8 7.4 6 9.6 6 15.4 6 18.6 8.4 21 12 21Z" />
    </>
  ),
  /* Brand marks keep their own geometry and are filled, not stroked. */
  google: (
    <path
      fill="currentColor"
      stroke="none"
      d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22ZM6.41 13.91a6 6 0 0 1 0-3.82V7.5H3.07a10 10 0 0 0 0 9l3.34-2.59ZM12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.5l3.34 2.59C7.2 7.73 9.4 5.98 12 5.98Z"
    />
  ),
};

export function Icon({ name, size = 20, strong, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strong ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Category slug → icon. Kept here so the DB stores a key, not a glyph. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  people: "people",
  characters: "characters",
  animals: "animals",
  food: "food",
  objects: "objects",
  tech: "tech",
  games: "games",
  screen: "screen",
  music: "music",
  sports: "sports",
  places: "places",
  concepts: "concepts",
  mythical: "mythical",
  vehicles: "vehicles",
  cursed: "cursed",
};

export function categoryIcon(slug: string | null | undefined): IconName {
  return (slug && CATEGORY_ICONS[slug]) || "bolt";
}
