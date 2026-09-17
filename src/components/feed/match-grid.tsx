import { MatchCard } from "@/components/feed/match-card";
import { IconTile } from "@/components/ui/icon-tile";
import type { MatchSummary } from "@/db/queries/matches";

export function MatchGrid({
  matches,
  variant = "default",
  hideStatus,
}: {
  matches: MatchSummary[];
  variant?: "default" | "result";
  hideStatus?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} variant={variant} hideStatus={hideStatus} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-rule-strong px-6 py-16 text-center">
      <IconTile name="bolt" tone="marigold" className="h-12 w-12 rounded-full" />
      <h3 className="mt-4 font-display text-2xl text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-pretty text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
