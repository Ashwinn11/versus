import type { Metadata } from "next";
import Link from "next/link";

import { LoadMore } from "@/components/feed/load-more";
import { MatchGrid, EmptyState } from "@/components/feed/match-grid";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { listMatches } from "@/db/queries/matches";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your matches" };
export const dynamic = "force-dynamic";

export default async function MyMatchesPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-ink">Your matches</h1>
        <p className="mt-2 text-ink-soft">Sign in to see the matches you&rsquo;ve created.</p>
        <Link
          href="/create"
          className="press mt-6 inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-paper"
        >
          Go to sign in
          <Icon name="arrow-right" size={17} strong />
        </Link>
      </div>
    );
  }

  const { items, nextCursor } = await listMatches({
    createdBy: session.user.id,
    limit: 12,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-center gap-3">
        <IconTile name="flame" tone="berry" />
        <div>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-ink">
            Your matches
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {items.length === 0 ? "Nothing yet." : "Matches you started."}
          </p>
        </div>
      </header>

      {items.length > 0 ? (
        <>
          <MatchGrid matches={items} />
          <LoadMore initialCursor={nextCursor} mine />
        </>
      ) : (
        <EmptyState
          title="No matches yet"
          body="Put two things in the ring and let the internet settle it."
          action={
            <Link
              href="/create"
              className="press inline-flex items-center gap-2 rounded-pill bg-marigold-400 px-5 py-2.5 font-bold text-ink"
            >
              <Icon name="plus" size={16} strong />
              Create your first match
            </Link>
          }
        />
      )}
    </div>
  );
}
