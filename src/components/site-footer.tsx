import Link from "next/link";

import { Icon } from "@/components/ui/icon";

const LINKS = [
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/create", label: "Create a match" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule/70 bg-sand/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="press inline-flex items-center gap-2">
              <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-xl bg-ink text-[0.65rem] font-bold text-paper">
                VS
              </span>
              <span className="font-display text-xl font-bold leading-none text-ink">
                Versus
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-pretty text-sm text-ink-soft">
              Two contenders, one question, and a crowd that decides. Anything
              versus anything.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-16">
            <nav aria-label="Browse">
              <p className="label mb-3">Browse</p>
              <ul className="space-y-2">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal">
              <p className="label mb-3">Legal</p>
              <ul className="space-y-2">
                {LEGAL.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule/70 pt-6">
          <p className="text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} Versus
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Icon name="bolt" size={13} />
            Voting is anonymous. No account needed.
          </p>
        </div>
      </div>
    </footer>
  );
}
