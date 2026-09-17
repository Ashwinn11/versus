import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils";

/**
 * The headline vote tally. Shared by the match page and the homepage main
 * event so the two can't drift apart — it appears in the same badge row on
 * both, and it is the number the whole product is about.
 */
export function VoteCountPill({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-pill bg-ink px-3 py-1.5 text-paper",
        className,
      )}
    >
      <span className="tnum font-display text-base font-bold leading-none">
        {formatCount(total)}
      </span>
      <span className="label !text-paper/70">{total === 1 ? "vote" : "votes"}</span>
    </span>
  );
}
