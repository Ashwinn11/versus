import type { ResolvedContender } from "@/lib/contenders";
import { pairStats } from "@/lib/contenders";

/**
 * The tale of the tape: one row per attribute, both sides drawn from the
 * centre outward so the longer bar is instantly the stronger one. Attributes
 * present on only one side still get a row — dropping them would quietly
 * flatter whoever forgot to fill it in.
 */
export function TaleOfTheTape({
  a,
  b,
}: {
  a: ResolvedContender;
  b: ResolvedContender;
}) {
  const rows = pairStats(a.stats, b.stats);
  if (rows.length === 0) return null;

  return (
    <section className="rounded-card bg-card p-5 card-shadow sm:p-7">
      <header className="mb-5 text-center">
        <h2 className="font-display text-2xl text-ink">Tale of the tape</h2>
      </header>

      <div className="space-y-3.5">
        {rows.map((row) => {
          const max = Math.max(row.a, row.b, 1);
          return (
            <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center justify-end gap-2.5">
                <span className="tnum text-sm font-bold text-ink">{row.a}</span>
                <div className="h-2.5 w-full max-w-[9rem] overflow-hidden rounded-pill bg-tint">
                  <div
                    className="ml-auto h-full rounded-pill transition-[width] duration-500 ease-out-quint"
                    style={{ width: `${(row.a / max) * 100}%`, background: a.color }}
                  />
                </div>
              </div>

              <span className="label whitespace-nowrap px-1 text-center">
                {row.label}
              </span>

              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-full max-w-[9rem] overflow-hidden rounded-pill bg-tint">
                  <div
                    className="h-full rounded-pill transition-[width] duration-500 ease-out-quint"
                    style={{ width: `${(row.b / max) * 100}%`, background: b.color }}
                  />
                </div>
                <span className="tnum text-sm font-bold text-ink">{row.b}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
