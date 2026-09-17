import Link from "next/link";

import { CategoryNav } from "@/components/feed/category-nav";
import { LoadMore } from "@/components/feed/load-more";
import { EmptyState, MatchGrid } from "@/components/feed/match-grid";
import { MainEvent } from "@/components/match/main-event";
import { Icon } from "@/components/ui/icon";
import { getMainEvent, listCategories, listMatches } from "@/db/queries/matches";

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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      {mainEvent ? (
        <MainEvent match={mainEvent} />
      ) : (
        <EmptyState
          title="The arena is empty"
          body="No live matches yet. Be the first to put two things in the ring."
          action={
            <Link
              href="/create"
              className="press inline-flex items-center gap-2 rounded-pill bg-marigold-400 px-5 py-2.5 font-bold text-ink"
            >
              <Icon name="plus" size={16} strong />
              Create the first match
            </Link>
          }
        />
      )}

      <div className="mt-12">
        <CategoryNav categories={categories} />
      </div>

      <section className="mt-8">
        <SectionHeading icon="live" title="Happening now" accent />
        {live.items.length > 0 ? (
          <>
            <MatchGrid matches={live.items} />
            <LoadMore initialCursor={live.nextCursor} status="live" />
          </>
        ) : (
          <EmptyState
            title="Nothing live"
            body="Every match has been settled. Start the next one."
          />
        )}
      </section>

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
