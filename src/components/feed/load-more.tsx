"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { MatchCard } from "@/components/feed/match-card";
import { Icon } from "@/components/ui/icon";
import type { MatchSummary } from "@/db/queries/matches";

type Props = {
  initialCursor: string | null;
  categorySlug?: string;
  tagSlug?: string;
  status?: string;
  /** Must match the first page's variant, or page two changes shape. */
  variant?: "default" | "result";
  hideStatus?: boolean;
  /** Scopes paging to the signed-in user's own matches. */
  mine?: boolean;
};

/**
 * Appends pages via the keyset cursor. Auto-loads when the sentinel comes into
 * view, but keeps a real button: an observer alone leaves keyboard users with
 * no way to reach page two, and IntersectionObserver never fires in some
 * embedded webviews.
 */
export function LoadMore({
  initialCursor,
  categorySlug,
  tagSlug,
  status,
  variant = "default",
  hideStatus,
  mine,
}: Props) {
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  async function loadNext(next: string) {
    const params = new URLSearchParams({ cursor: next });
    if (categorySlug) params.set("category", categorySlug);
    if (tagSlug) params.set("tag", tagSlug);
    if (status) params.set("status", status);
    if (mine) params.set("mine", "1");

    try {
      const res = await fetch(`/api/matches?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        items: MatchSummary[];
        nextCursor: string | null;
      };
      startTransition(() => {
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
        setError(null);
      });
    } catch {
      setError("Couldn't load more matches.");
    }
  }

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || pending) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNext(cursor);
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, pending]);

  return (
    <>
      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <MatchCard key={m.id} match={m} variant={variant} hideStatus={hideStatus} />
          ))}
        </div>
      )}

      <div ref={sentinel} className="mt-8 flex justify-center">
        {error ? (
          <button
            onClick={() => cursor && void loadNext(cursor)}
            className="press rounded-pill border border-rule bg-card px-5 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            {error} Retry
          </button>
        ) : cursor ? (
          <button
            onClick={() => void loadNext(cursor)}
            disabled={pending}
            className="press inline-flex items-center gap-2 rounded-pill border border-rule bg-card px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-rule-strong hover:text-ink disabled:opacity-50"
          >
            {pending ? "Loading…" : "Load more"}
            {!pending && <Icon name="chevron-down" size={15} />}
          </button>
        ) : null}
      </div>
    </>
  );
}
