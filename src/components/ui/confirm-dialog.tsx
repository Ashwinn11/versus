"use client";

import { useEffect, useId, useRef, useState } from "react";

import { type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

type Tone = "default" | "danger";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  tone?: Tone;
};

/**
 * One confirmation dialog for the whole app.
 *
 * Built on the native `<dialog>` element so focus trapping, Escape-to-close,
 * inertness of the page behind it, and the top-layer stacking all come from the
 * browser — hand-rolled modals get those wrong far more often than not.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  icon,
  tone = "default",
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      // `cancel` fires on Escape and on the backdrop's close request, so this
      // keeps React state in step with a close the browser performed itself.
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        // Clicks land on the dialog element itself only when they hit the
        // backdrop; anything inside the panel stops at the panel.
        if (e.target === ref.current && !busy) onClose();
      }}
      className={cn(
        "m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card border border-rule bg-card p-0 text-ink",
        "backdrop:bg-ink/40 backdrop:backdrop-blur-sm",
        "open:animate-none",
      )}
    >
      {/* Centred rather than left-aligned: this is a short, single-decision
          alert, not a form, and the convention people expect from one is the
          icon on top with the actions side by side beneath. */}
      <div className="p-6 text-center">
        {icon && (
          <IconTile
            name={icon}
            tone={tone === "danger" ? "berry" : "marigold"}
            size="sm"
            className="mx-auto"
          />
        )}

        <h2 id={titleId} className="mt-4 font-display text-xl leading-tight text-ink">
          {title}
        </h2>
        <div
          id={descId}
          className="mx-auto mt-2 max-w-[30ch] text-pretty text-sm leading-relaxed text-ink-soft"
        >
          {description}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-berry">{error}</p>}

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="press flex-1 rounded-pill border border-rule px-4 py-2.5 text-sm font-bold text-ink-soft hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={cn(
              "press flex-1 rounded-pill px-4 py-2.5 text-sm font-bold disabled:opacity-40",
              tone === "danger" ? "bg-berry text-white" : "bg-ink text-paper",
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
