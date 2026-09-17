import type { ReactNode } from "react";

/**
 * Shared shell for the legal pages. Narrow measure (~68ch) because these are
 * the only long-form reading surfaces in the app and the feed's full width is
 * unreadable for body text.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <div className="mx-auto max-w-[68ch]">
        <p className="label">Last updated {updated}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] leading-none text-ink">
          {title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-ink-soft">{intro}</p>
        <div className="mt-10 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 text-pretty leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
