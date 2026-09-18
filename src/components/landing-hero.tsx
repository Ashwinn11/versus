import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { IconTile, type Tone } from "@/components/ui/icon-tile";
import { SITE_TAGLINE } from "@/lib/site";

const EXAMPLES = [
  { a: "Coffee", b: "Tea", colorA: "#a16207", colorB: "#84cc16" },
  { a: "A Rock", b: "A Printer", colorA: "#8d8378", colorB: "#f43f5e" },
  { a: "Cats", b: "Dogs", colorA: "#fb923c", colorB: "#facc15" },
];

/**
 * What the homepage shows when no match is running.
 *
 * An empty arena is the first thing most people will ever see, so it explains
 * the product rather than apologising for having no data. The sample matchups
 * are static illustrations — they are not links, because nothing exists behind
 * them yet and a dead link is worse than no link.
 */
export function LandingHero() {
  return (
    <section className="pb-10 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-marigold-400 px-3 py-1.5">
        <Icon name="flame" size={14} className="text-ink" strong />
        <span className="label !text-ink">The arena is open</span>
      </span>

      <h1 className="mx-auto mt-4 max-w-2xl text-balance font-display text-[clamp(2rem,5.2vw,3.4rem)] leading-[0.98] text-ink">
        {SITE_TAGLINE}.
      </h1>

      <p className="mx-auto mt-3 max-w-lg text-pretty text-sm text-ink-soft sm:text-base">
        Anything versus anything. Put two things in the ring, ask one question,
        and let the crowd settle it — a person, a rock, an abstract concept.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2.5 sm:gap-3">
        <Link
          href="/create"
          className="press inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-ink px-4 py-3 text-sm font-bold text-paper hover:bg-ink-soft sm:flex-none sm:px-6 sm:text-base"
        >
          <Icon name="plus" size={17} strong />
          <span className="sm:hidden">Start a match</span>
          <span className="hidden sm:inline">Start the first match</span>
        </Link>
        <Link
          href="/hall-of-fame"
          className="press inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-marigold-400 px-4 py-3 text-sm font-bold text-ink hover:bg-marigold-300 sm:flex-none sm:px-6 sm:text-base"
        >
          <Icon name="trophy" size={17} />
          Hall of Fame
        </Link>
      </div>

      <div className="mt-9">
        <p className="label mb-3">Matchups people run here</p>
        <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {EXAMPLES.map((e) => (
            <li
              key={`${e.a}-${e.b}`}
              className="flex items-center justify-center gap-2.5 rounded-card bg-card px-4 py-3 card-shadow"
            >
              <span className="truncate font-display text-lg text-ink">{e.a}</span>
              <span
                className="grid h-7 w-7 shrink-0 -rotate-6 place-items-center rounded-full bg-ink text-[0.6rem] font-bold text-paper"
                aria-label="versus"
              >
                VS
              </span>
              <span className="truncate font-display text-lg text-ink">{e.b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-9 grid max-w-3xl gap-5 sm:grid-cols-3">
        <Step
          icon="plus"
          tone="grape"
          title="Create"
          body="Two contenders, one question, a deadline. Sign in to start one."
        />
        <Step
          icon="share"
          tone="leaf"
          title="Share"
          body="Send the link. Anyone can vote — no account, no sign-up wall."
        />
        <Step
          icon="trophy"
          tone="marigold"
          title="Settle it"
          body="Votes land live. When the clock runs out, the result is final."
        />
      </div>
    </section>
  );
}

function Step({
  icon,
  tone,
  title,
  body,
}: {
  icon: "plus" | "share" | "trophy";
  tone: Tone;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <IconTile name={icon} tone={tone} size="sm" className="mx-auto sm:mx-0" />
      <h3 className="mt-3 font-display text-xl text-ink">{title}</h3>
      <p className="mt-1 text-pretty text-sm leading-snug text-ink-soft">{body}</p>
    </div>
  );
}
