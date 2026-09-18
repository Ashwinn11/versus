import { CategoryNav } from "@/components/feed/category-nav";
import { LoadMore } from "@/components/feed/load-more";
import { EmptyState, MatchGrid } from "@/components/feed/match-grid";
import { type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { listCategories, listMatches, type MatchStatus } from "@/db/queries/matches";

/**
 * Shared shell for every filtered feed — category, tag and Hall of Fame all
 * differ only in their filter and their heading, so they share one layout and
 * one pagination path rather than each growing their own.
 */
export async function FeedPage({
  title,
  subtitle,
  icon,
  accent,
  categorySlug,
  status,
  showNav = true,
  variant = "default",
  empty,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  accent?: string;
  categorySlug?: string;
  status?: MatchStatus | MatchStatus[];
  showNav?: boolean;
  /** `result` leads each card with its winner. */
  variant?: "default" | "result";
  empty: { title: string; body: string };
}) {
  const [categories, page] = await Promise.all([
    showNav ? listCategories() : Promise.resolve([]),
    listMatches({ categorySlug, status, limit: 12 }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-center gap-3">
        {icon && <IconTile name={icon} accent={accent} />}
        <div>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          )}
        </div>
      </header>

      {showNav && (
        <div className="mb-8">
          <CategoryNav categories={categories} />
        </div>
      )}

      {page.items.length > 0 ? (
        <>
          <MatchGrid
            matches={page.items}
            variant={variant}
            // Every card in a single-status feed carries the same pill, so it
            // stops telling you anything and is just noise on each one.
            hideStatus={typeof status === "string"}
          />
          <LoadMore
            initialCursor={page.nextCursor}
            categorySlug={categorySlug}
            status={typeof status === "string" ? status : undefined}
            variant={variant}
            hideStatus={typeof status === "string"}
          />
        </>
      ) : (
        <EmptyState title={empty.title} body={empty.body} />
      )}
    </div>
  );
}
