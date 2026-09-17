"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";

/**
 * Sharing is the growth loop, so it gets a real control rather than a buried
 * icon. Uses the native share sheet where there is one (every phone) and falls
 * back to copying the link.
 */
export function ShareRow({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/m/${slug}`;
    // URL only. Share targets concatenate `title` and `text` onto the link, so
    // choosing "Copy" from the sheet produced "Pick a side.\nhttp://..." rather
    // than something you can paste into an address bar. The page's own OG tags
    // already supply the title and description wherever the link lands.
    const data = { url };

    if (navigator.share && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // Cancelled, or the sheet refused — fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission); nothing
      // useful left to try, and failing silently beats an alert.
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-sand/70 px-5 py-6 text-center">
      <p className="text-balance font-display text-xl text-ink">
        Think the crowd is wrong?
      </p>
      <p className="-mt-2 text-sm text-ink-soft">
        Send it to someone who&rsquo;ll disagree.
      </p>
      <button
        onClick={share}
        className="press inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-2.5 text-sm font-bold text-paper hover:bg-ink-soft"
      >
        <Icon name={copied ? "check" : "share"} size={16} strong />
        {copied ? "Link copied" : "Share this match"}
      </button>
    </div>
  );
}
