"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Account control in the header. Signed out it is a single sign-in button;
 * signed in it is the avatar plus the three things an account actually needs:
 * find my matches, leave, or delete.
 */
export function AccountMenu({ googleReady }: { googleReady: boolean }) {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reserve the space while the session resolves, so the header doesn't jump.
  if (isPending) return <div className="h-9 w-9" />;

  if (!session) {
    if (!googleReady) return null;
    return (
      <button
        onClick={() => signIn.social({ provider: "google", callbackURL: "/create" })}
        className="press inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-sand hover:text-ink"
      >
        <Icon name="google" size={16} />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const user = session.user;
  const initial = (user.name || user.email || "?").trim()[0]?.toUpperCase() ?? "?";

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className={cn(
          "press grid h-9 w-9 place-items-center overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-paper",
          open ? "ring-ink" : "ring-rule hover:ring-rule-strong",
        )}
      >
        {user.image ? (
          // Avatars come from Google's CDN on many hosts, so this stays a
          // plain <img> rather than widening next/image's remote allow-list
          // to a domain we do not control.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="bg-ink text-sm font-bold text-paper">{initial}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-40 w-60 overflow-hidden rounded-2xl border border-rule bg-card card-shadow-lg"
        >
          <div className="border-b border-rule px-4 py-3">
            <p className="truncate text-sm font-bold text-ink">{user.name || "Signed in"}</p>
            <p className="truncate text-xs text-ink-faint">{user.email}</p>
          </div>

          <div className="py-1.5">
            <Link
              href="/my-matches"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sand"
            >
              <Icon name="flame" size={17} className="text-ink-soft" />
              Your matches
            </Link>
            <button
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.refresh();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-sand"
            >
              <Icon name="arrow-right" size={17} className="text-ink-soft" />
              Sign out
            </button>
          </div>

          <div className="border-t border-rule py-1.5">
            <DeleteAccount onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Deleting an account is irreversible and takes every match the person made
 * with it, so it asks for the word "delete" rather than an easily-mistyped
 * confirm button — and says plainly what goes.
 */
function DeleteAccount({ onDone }: { onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    if (text.trim().toLowerCase() !== "delete" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the account");
      onDone();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        role="menuitem"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-berry hover:bg-berry/8"
      >
        <Icon name="close" size={17} />
        Delete account
      </button>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-ink">
        This deletes your account and every match you created. It can&rsquo;t be undone.
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type delete"
        className="mt-2 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm focus:border-berry focus:outline-none"
      />
      {error && <p className="mt-1.5 text-xs font-semibold text-berry">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={run}
          disabled={text.trim().toLowerCase() !== "delete" || busy}
          className="press flex-1 rounded-pill bg-berry px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setText("");
          }}
          className="press rounded-pill border border-rule px-3 py-2 text-xs font-bold text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
