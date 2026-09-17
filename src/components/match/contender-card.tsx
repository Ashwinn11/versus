import Image from "next/image";

import { Icon } from "@/components/ui/icon";
import type { ResolvedContender } from "@/lib/contenders";
import { cn, formatCount } from "@/lib/utils";

type Props = {
  contender: ResolvedContender;
  percentage: number;
  /** Reveal tallies. Hidden before a vote so the crowd can't anchor you. */
  revealed: boolean;
  isWinner?: boolean;
  isVoted?: boolean;
  size?: "hero" | "card";
  tilt?: "l" | "r" | null;
  /** Rendered when the card is votable. Omitted on read-only surfaces. */
  action?: React.ReactNode;
  className?: string;
};

/**
 * One contender, as a collectible card in two halves: the portrait up top, and
 * a detail panel below tinted with the contender's own colour so each card
 * reads as theirs at a glance.
 *
 * Used identically on the match page, the create preview and the OG image — it
 * takes an already-resolved contender, so it never needs to know that
 * nickname/colour/stats may have come from the roster defaults.
 */
export function ContenderCard({
  contender,
  percentage,
  revealed,
  isWinner,
  isVoted,
  size = "card",
  tilt = null,
  action,
  className,
}: Props) {
  const hero = size === "hero";

  return (
    <div
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-card bg-card",
        "card-shadow transition-[box-shadow,rotate,translate] duration-300 ease-out-quint",
        "hover:card-shadow-lg hover:-translate-y-1",
        tilt === "l" && "tilt-l",
        tilt === "r" && "tilt-r",
        className,
      )}
      style={{ ["--card-accent" as string]: contender.color }}
    >
      {/* Top half — the portrait. */}
      <div className="relative aspect-square w-full overflow-hidden bg-sand">
        {contender.imageUrl ? (
          <Image
            src={contender.imageUrl}
            alt=""
            fill
            sizes={hero ? "(max-width: 768px) 46vw, 400px" : "(max-width: 768px) 46vw, 260px"}
            className="img-edge object-cover transition-transform duration-500 ease-out-quint group-hover/card:scale-[1.04]"
            priority={hero}
          />
        ) : (
          <InitialPortrait name={contender.name} />
        )}

        {isWinner && <Ribbon icon="trophy" label="Winner" tone="gold" />}
        {isVoted && !isWinner && <Ribbon icon="check" label="Your pick" tone="ink" />}
      </div>

      {/* Bottom half — details, tinted in the contender's colour. */}
      <div className="bg-accent-tint flex flex-1 flex-col gap-0.5 px-4 pb-3.5 pt-3 sm:px-4.5">
        {contender.nickname && (
          <p className="label !text-ink-soft truncate" title={contender.nickname}>
            {contender.nickname}
          </p>
        )}
        <h3
          className={cn(
            "text-balance font-display leading-[0.95] text-ink",
            hero
              ? "text-[clamp(1.6rem,3.6vw,2.75rem)]"
              : "text-[clamp(1.25rem,2.8vw,1.75rem)]",
          )}
        >
          {contender.name}
        </h3>

        {contender.answer && (
          <p className="mt-1 line-clamp-2 text-pretty text-[0.8rem] leading-snug text-ink-soft">
            &ldquo;{contender.answer}&rdquo;
          </p>
        )}

        {revealed ? (
          <div className="mt-auto flex items-end justify-between pt-2.5">
            <span className="tnum text-accent font-display text-[2rem] font-semibold leading-none">
              {percentage}
              <span className="text-[1rem]">%</span>
            </span>
            <span className="tnum pb-0.5 text-xs font-semibold text-ink-soft">
              {formatCount(contender.voteCount)} votes
            </span>
          </div>
        ) : action ? null : (
          <span className="label mt-auto pt-2.5">Pick to reveal</span>
        )}

        {action && <div className="mt-auto pt-2.5">{action}</div>}
      </div>
    </div>
  );
}

function Ribbon({
  icon,
  label,
  tone,
}: {
  icon: "trophy" | "check";
  label: string;
  tone: "gold" | "ink";
}) {
  return (
    <div
      className={cn(
        "absolute left-3 top-3 flex items-center gap-1.5 rounded-pill px-2.5 py-1 shadow-sm",
        tone === "gold" ? "bg-marigold-400 text-ink" : "bg-ink text-paper",
      )}
    >
      <Icon name={icon} size={13} strong />
      <span className="label !tracking-[0.1em] !text-current">{label}</span>
    </div>
  );
}

/**
 * Stand-in portrait built from the contender's own colour and initials. Most
 * contenders genuinely have no photo — "a rock" is not going to arrive with a
 * headshot — so this has to look deliberate rather than broken.
 */
function InitialPortrait({ name }: { name: string }) {
  const initials = name
    .replace(/^(a|an|the)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="img-edge grid h-full w-full place-items-center"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 15%, color-mix(in oklch, var(--card-accent) 38%, white), color-mix(in oklch, var(--card-accent) 12%, white))",
      }}
    >
      <span className="text-accent font-display text-[3.5rem] font-bold leading-none sm:text-[4.5rem]">
        {initials}
      </span>
    </div>
  );
}
