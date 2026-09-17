import { cn } from "@/lib/utils";

/**
 * The VS sticker that sits between two contenders. Drawn rather than typed so
 * its weight stays identical at every size, including inside the OG image
 * where no web font is guaranteed to have loaded.
 */
export function VersusMark({
  size = 64,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid -rotate-6 place-items-center rounded-full bg-ink text-paper shadow-lg ring-4 ring-paper",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="versus"
    >
      <svg
        viewBox="0 0 48 32"
        width={size * 0.5}
        height={size * 0.33}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2 4h7.5l5.5 16.5L20.5 4H28L18.5 30h-7L2 4Z" />
        <path d="M38.5 3.2c4.2 0 7 1.6 8.3 4.3l-5.6 2.8c-.6-1.2-1.6-1.8-3-1.8-1.3 0-2.1.5-2.1 1.4 0 1 .9 1.4 3.6 2.1 4.6 1.2 7.3 2.9 7.3 7.3 0 5-4 7.9-9.6 7.9-4.8 0-8.2-1.9-9.6-5.1l5.8-2.8c.7 1.5 2 2.3 3.8 2.3 1.5 0 2.4-.6 2.4-1.6 0-1.1-1-1.5-3.8-2.2-4.4-1.1-7-3-7-7.2 0-4.5 3.8-7.4 9.5-7.4Z" />
      </svg>
    </span>
  );
}
