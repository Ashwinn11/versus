"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, categoryIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type MenuCategory = { slug: string; name: string; accentColor: string };

/**
 * Category jump-menu in the header, available from every page.
 *
 * The rail on the feed pages only exists there, so from a match page there was
 * no way to reach a category without going home first. Searchable because
 * fifteen entries is past the point where scanning beats typing.
 */
export function CategoryMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const activeSlug = pathname.startsWith("/c/") ? pathname.slice(3) : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [categories, query]);

  // Clamped here rather than synced from an effect — the effect version
  // rendered once with a stale index before correcting itself.
  const activeIndex = Math.min(active, Math.max(matches.length - 1, 0));

  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Resetting the query here keeps it out of an effect that watches `open`. */
  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => (open ? closeMenu() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "press inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill p-2 text-sm font-semibold sm:px-3 sm:py-2",
          open ? "bg-sand text-ink" : "text-ink-soft hover:bg-sand hover:text-ink",
        )}
      >
        <Icon name="games" size={17} />
        <span className="hidden sm:inline">Categories</span>
        <Icon
          name="chevron-down"
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute left-0 top-[calc(100%+0.6rem)] z-40 w-64 overflow-hidden rounded-2xl border border-rule bg-card card-shadow-lg",
            "max-sm:fixed max-sm:inset-x-3 max-sm:top-[4.25rem] max-sm:w-auto max-sm:max-h-[calc(100dvh-5.5rem)] max-sm:overflow-y-auto",
          )}
        >
          <div className="flex items-center gap-2 border-b border-rule px-3.5 py-2.5">
            <Icon name="search" size={16} className="text-ink-faint" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive(Math.min(activeIndex + 1, matches.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive(Math.max(activeIndex - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = matches[activeIndex];
                  if (pick) {
                    closeMenu();
                    router.push(`/c/${pick.slug}`);
                  }
                }
              }}
              placeholder="Search categories…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <div className="max-h-[22rem] overflow-y-auto py-1.5">
            {matches.length === 0 && (
              <p className="px-3.5 py-3 text-sm text-ink-faint">Nothing matches that.</p>
            )}
            {matches.map((c, i) => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                role="menuitem"
                onClick={closeMenu}
                onPointerEnter={() => setActive(i)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-ink",
                  i === activeIndex ? "bg-sand" : "bg-transparent",
                )}
              >
                <Icon name={categoryIcon(c.slug)} size={17} style={{ color: c.accentColor }} />
                {c.name}
                {c.slug === activeSlug && (
                  <Icon name="check" size={15} strong className="ml-auto text-ink" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
