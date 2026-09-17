"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GoogleMark } from "@/components/ui/google-mark";
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
  const [confirming, setConfirming] = useState<"signout" | "delete" | null>(null);
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
        aria-label="Sign in with Google"
        className="press inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-sand hover:text-ink"
      >
        <GoogleMark size={16} />
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
          className={cn(
            "absolute right-0 top-[calc(100%+0.6rem)] z-40 w-60 overflow-hidden rounded-2xl border border-rule bg-card card-shadow-lg",
            "max-sm:fixed max-sm:inset-x-3 max-sm:top-[4.25rem] max-sm:w-auto max-sm:max-h-[calc(100dvh-5.5rem)] max-sm:overflow-y-auto",
          )}
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
              onClick={() => {
                setOpen(false);
                setConfirming("signout");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-sand"
            >
              <Icon name="logout" size={17} className="text-ink-soft" />
              Sign out
            </button>
          </div>

          <div className="border-t border-rule py-1.5">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirming("delete");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-berry hover:bg-berry/8"
            >
              <Icon name="trash" size={17} />
              Delete account
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming === "signout"}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          await signOut();
          setConfirming(null);
          router.refresh();
        }}
        title="Sign out?"
        description="You can still vote on any match without an account."
        confirmLabel="Sign out"
        icon="logout"
      />

      <ConfirmDialog
        open={confirming === "delete"}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          const res = await fetch("/api/account", { method: "DELETE" });
          if (!res.ok) throw new Error("Could not delete the account");
          setConfirming(null);
          router.push("/");
          router.refresh();
        }}
        title="Delete your account?"
        description="This can't be undone. Matches you created stay up, without your name on them."
        confirmLabel="Delete account"
        icon="trash"
        tone="danger"
      />
    </div>
  );
}

