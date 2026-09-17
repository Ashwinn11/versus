import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { CategoryMenu } from "@/components/category-menu";
import { Icon } from "@/components/ui/icon";
import { listCategories } from "@/db/queries/matches";
import { isGoogleConfigured } from "@/env";

export async function SiteHeader() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-50 border-b border-rule/60 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="press group flex items-center gap-2">
          <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-xl bg-ink text-[0.65rem] font-bold text-paper transition-transform duration-300 group-hover:rotate-0">
            VS
          </span>
          <span className="font-display text-2xl font-bold leading-none text-ink">
            Versus
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <CategoryMenu
            categories={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
              accentColor: c.accentColor,
            }))}
          />
          <Link
            href="/hall-of-fame"
            className="press inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-sand hover:text-ink"
          >
            <Icon name="trophy" size={17} />
            <span className="hidden sm:inline">Hall of Fame</span>
          </Link>
          <Link
            href="/create"
            className="press inline-flex items-center gap-1.5 rounded-pill bg-marigold-400 px-3.5 py-2 text-sm font-bold text-ink hover:bg-marigold-300 sm:px-4"
          >
            <Icon name="plus" size={16} strong />
            <span className="hidden sm:inline">Create match</span>
            <span className="sm:hidden">New</span>
          </Link>
          <AccountMenu googleReady={isGoogleConfigured()} />
        </nav>
      </div>
    </header>
  );
}
