import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Named tones so tiles stay on-palette instead of accumulating stray hexes. */
const TONES = {
  marigold: "bg-marigold-400/18 text-marigold-600",
  berry: "bg-berry/12 text-berry",
  grape: "bg-grape/12 text-grape",
  leaf: "bg-leaf/16 text-leaf",
  neutral: "bg-sand text-ink-soft",
} as const;

export type Tone = keyof typeof TONES;

/**
 * The rounded tile an icon sits in — section headers, steps, empty states.
 *
 * Colour is the default rather than the exception: these tiles were all grey
 * on a page where every other surface carries a hue, which made them read as
 * disabled. A category's own accent can be passed instead via `accent`, so a
 * category header matches the colour used for it everywhere else.
 */
export function IconTile({
  name,
  tone = "marigold",
  accent,
  size = "md",
  className,
}: {
  name: IconName;
  tone?: Tone;
  /** A category's accent colour, which wins over `tone`. */
  accent?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "h-10 w-10 rounded-2xl" : "h-11 w-11 rounded-2xl";
  const glyph = size === "sm" ? 19 : 22;

  return (
    <span
      className={cn("grid shrink-0 place-items-center", box, !accent && TONES[tone], className)}
      style={
        accent
          ? {
              // Tint from the accent itself so the tile and glyph always agree,
              // whatever colour a category is seeded with.
              backgroundColor: `color-mix(in oklch, ${accent} 18%, white)`,
              color: `color-mix(in oklch, ${accent} 72%, black)`,
            }
          : undefined
      }
    >
      <Icon name={name} size={glyph} />
    </span>
  );
}
