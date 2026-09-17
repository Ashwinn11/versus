"use client";

import { useState } from "react";

import { GoogleMark } from "@/components/ui/google-mark";
import { signIn } from "@/lib/auth-client";

/**
 * Voting is anonymous; creating is not. This is the only place the product
 * ever asks for an account, and it says why rather than just demanding one.
 */
export function SignInGate({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      await signIn.social({ provider: "google", callbackURL: "/create" });
    } catch {
      setError("Couldn't reach Google. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-card bg-card p-8 text-center card-shadow">
      <span className="mx-auto grid h-14 w-14 -rotate-6 place-items-center rounded-2xl bg-ink text-base font-bold text-paper">
        VS
      </span>
      <h1 className="mt-5 font-display text-3xl text-ink">Start a match</h1>
      <p className="mt-2 text-pretty text-sm text-ink-soft">
        Anyone can vote without an account. Creating a match needs one, so every
        matchup has someone behind it.
      </p>

      {configured ? (
        <button
          onClick={go}
          disabled={busy}
          className="press mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-pill border border-rule bg-card px-6 py-3.5 font-bold text-ink hover:border-rule-strong hover:bg-sand disabled:opacity-60"
        >
          <GoogleMark size={18} />
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
      ) : (
        <p className="mt-6 rounded-2xl bg-sand px-4 py-3 text-sm text-ink-soft">
          Google sign-in isn&rsquo;t configured on this deployment yet.
        </p>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-berry">{error}</p>}
    </div>
  );
}
