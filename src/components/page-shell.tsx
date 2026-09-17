import { cn } from "@/lib/utils";

/**
 * One page container for the whole app.
 *
 * Pages had drifted to four different max-widths (7xl, 5xl, 4xl, lg), so the
 * content gutter visibly jumped as you moved between them and never lined up
 * with the header. Every page uses this now; anything that needs to be
 * narrower constrains itself *inside* it, so the outer margin stays fixed.
 */
export function PageShell({
  children,
  className,
  size = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  /** `wide` for grids and feeds, `focused` for a single-subject page. */
  size?: "wide" | "focused";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        size === "wide" ? "max-w-6xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
