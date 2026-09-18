import Link from "next/link";

import { CategoryNav } from "@/components/feed/category-nav";
import { LoadMore } from "@/components/feed/load-more";
import { MatchGrid } from "@/components/feed/match-grid";
import { LandingHero } from "@/components/landing-hero";
import { MainEvent } from "@/components/match/main-event";
import { Icon } from "@/components/ui/icon";
import { getMainEvent, listCategories, listMatches } from "@/db/queries/matches";
import { SITE_TAGLINE } from "@/lib/site";

// Feeds are shared across everyone and change only as matches are created or
// settled, so a short revalidate keeps the homepage cheap without ever showing
// a stale main event for long. Live tallies on it refresh client-side.
export const revalidate = 15;

export default async function HomePage() {
  const [mainEvent, categories, liveFeed, upcoming] = await Promise.all([
    getMainEvent(),
    listCategories(),
    listMatches({ status: "live", limit: 10 }),
    listMatches({ status: "scheduled", limit: 6 }),
  ]);

  const live = {
    ...liveFeed,
    items: liveFeed.items.filter((m) => m.id !== mainEvent?.id).slice(0, 9),
  };

  const isOnlyHero = !mainEvent && live.items.length === 0 && upcoming.items.length === 0;

  return (
    <div
      className={
        isOnlyHero
          ? "mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16"
          : "mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10"
      }
    >
      {mainEvent ? (
        <>
          {/* Once a main event exists the landing hero never renders, so this
              is the only place the positioning line reaches anyone above the
              fold. Held to a single label line on purpose: the main event sits
              deliberately tight to the top and cannot spare the height. */}
          <p className="label mb-3 text-center">{SITE_TAGLINE}</p>
          <MainEvent match={mainEvent} />
        </>
      ) : (
        <LandingHero />
      )}

      {live.items.length > 0 && (
        <>
          <div className="mt-12">
            <CategoryNav categories={categories} />
          </div>

          <section className="mt-8">
            <SectionHeading icon="live" title="Happening now" accent />
            <MatchGrid matches={live.items} />
            <LoadMore initialCursor={live.nextCursor} status="live" />
          </section>
        </>
      )}

      {upcoming.items.length > 0 && (
        <section className="mt-14">
          <SectionHeading icon="clock" title="Next up" />
          <MatchGrid matches={upcoming.items} />
          {upcoming.nextCursor && (
            <div className="mt-6 flex justify-center">
              <Link
                href="/upcoming"
                className="press inline-flex items-center gap-2 rounded-pill border border-rule bg-card px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"
              >
                See all upcoming
                <Icon name="arrow-right" size={15} strong />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  accent,
}: {
  icon: "live" | "clock";
  title: string;
  accent?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <Icon
        name={icon}
        size={16}
        className={accent ? "text-berry" : "text-ink-faint"}
      />
      <h2 className="font-display text-2xl leading-none text-ink">
        {title}
      </h2>
    </div>
  );
}
