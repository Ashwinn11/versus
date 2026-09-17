import type { Metadata } from "next";

import { CreateForm } from "@/components/create/create-form";
import { SignInGate } from "@/components/create/sign-in-gate";
import { listCategories } from "@/db/queries/matches";
import { isGoogleConfigured } from "@/env";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create a match",
  description: "Put two things in the ring and let the internet decide.",
};

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SignInGate configured={isGoogleConfigured()} />
      </div>
    );
  }

  const categories = await listCategories();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] leading-none text-ink">
          Start a match
        </h1>
        <p className="mt-2 text-pretty text-ink-soft">
          Anything versus anything. A person, a rock, an abstract concept — the
          arena does not discriminate.
        </p>
      </header>

      <CreateForm
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          accentColor: c.accentColor,
          isSystem: c.isSystem,
        }))}
      />
    </div>
  );
}
