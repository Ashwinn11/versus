"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, categoryIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Category = {
  slug: string;
  name: string;
  icon: string;
  accentColor: string;
};

/**
 * Horizontal category rail. Each entry carries its own accent, applied only
 * when active — a rail where every chip is brightly coloured is a rail nobody
 * can read.
 */
export function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/c/") ? pathname.slice(3) : null;

  return (
    <nav
      aria-label="Categories"
      className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      <Chip href="/" label="All" icon="bolt" active={activeSlug === null} accent="#f0a03c" />
      {categories.map((c) => (
        <Chip
          key={c.slug}
          href={`/c/${c.slug}`}
          label={c.name}
          icon={categoryIcon(c.slug)}
          active={activeSlug === c.slug}
          accent={c.accentColor}
        />
      ))}
    </nav>
  );
}

function Chip({
  href,
  label,
  icon,
  active,
  accent,
}: {
  href: string;
  label: string;
  icon: ReturnType<typeof categoryIcon> | "bolt";
  active: boolean;
  accent: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-2 text-sm font-medium",
        active
          ? "border-transparent text-ink shadow-sm"
          : "border-rule text-ink-soft hover:border-rule-strong hover:bg-card hover:text-ink",
      )}
      style={active ? { backgroundColor: accent } : undefined}
    >
      <Icon
        name={icon}
        size={16}
        style={!active ? { color: accent } : undefined}
      />
      {label}
    </Link>
  );
}
