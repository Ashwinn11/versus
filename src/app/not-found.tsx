import Link from "next/link";

import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <span className="grid h-16 w-16 -rotate-6 place-items-center rounded-3xl bg-ink text-lg font-bold text-paper">
        VS
      </span>
      <h1 className="mt-6 font-display text-4xl text-ink">No contest here</h1>
      <p className="mt-2 text-pretty text-ink-soft">
        This match doesn&rsquo;t exist, or it was never created in the first
        place.
      </p>
      <Link
        href="/"
        className="press mt-7 inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-paper hover:bg-ink-soft"
      >
        Back to the arena
        <Icon name="arrow-right" size={17} strong />
      </Link>
    </div>
  );
}
