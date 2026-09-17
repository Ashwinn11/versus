"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, categoryIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type PickerCategory = { slug: string; name: string; accentColor: string };

/**
 * Searchable single-select for the match's category.
 *
 * A plain <select> can't show each category's icon and colour, and a static
 * chip rail forces every option on screen at once. This filters as you type
 * and is fully keyboard-driveable, because a picker you can only click is a
 * picker half the people filling this form can't use.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: PickerCategory[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const selected = categories.find((c) => c.slug === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
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
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function choose(slug: string) {
    onChange(slug === value ? "" : slug);
    closeMenu();
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "press flex w-full items-center gap-2.5 rounded-2xl border bg-card px-4 py-3 text-left text-sm",
          open ? "border-ink" : "border-rule hover:border-rule-strong",
        )}
      >
        {selected ? (
          <>
            <Icon
              name={categoryIcon(selected.slug)}
              size={18}
              style={{ color: selected.accentColor }}
            />
            <span className="font-semibold text-ink">{selected.name}</span>
          </>
        ) : (
          <>
            <Icon name="search" size={18} className="text-ink-faint" />
            <span className="text-ink-faint">Choose a category</span>
          </>
        )}
        <Icon
          name="chevron-down"
          size={16}
          className={cn("ml-auto text-ink-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-rule bg-card card-shadow-lg">
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
                  if (pick) choose(pick.slug);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  closeMenu();
                }
              }}
              placeholder="Search categories…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto py-1.5">
            {matches.length === 0 && (
              <li className="px-3.5 py-3 text-sm text-ink-faint">No category matches that.</li>
            )}
            {matches.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.slug === value}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(c.slug)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm",
                    i === activeIndex ? "bg-sand" : "bg-transparent",
                  )}
                >
                  <Icon name={categoryIcon(c.slug)} size={17} style={{ color: c.accentColor }} />
                  <span className="font-semibold text-ink">{c.name}</span>
                  {c.slug === value && (
                    <Icon name="check" size={16} strong className="ml-auto text-ink" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
