import { cn } from "@/lib/utils";

/**
 * "Live" with a pulsing dot — the only looping animation in the app. It earns
 * that because its entire meaning is "this is happening right now".
 */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-berry/10 px-2.5 py-1 ring-1 ring-berry/25",
        className,
      )}
    >
      <span className="relative grid h-2 w-2 place-items-center">
        <span className="absolute h-2 w-2 animate-ping rounded-full bg-berry opacity-70" />
        <span className="relative h-2 w-2 rounded-full bg-berry" />
      </span>
      <span className="label !tracking-[0.1em] !text-berry">Live</span>
    </span>
  );
}
