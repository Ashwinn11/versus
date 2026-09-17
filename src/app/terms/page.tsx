import type { Metadata } from "next";

import { LegalPage, List, Section } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules of the arena.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="17 September 2026"
      intro="The short version: be a decent person, don't put anything in the ring you have no right to, and understand that votes are final."
    >
      <Section heading="Using Versus">
        <p>
          Versus is a public voting arena. Anyone can vote; creating a match
          requires an account. You must be old enough to agree to these terms
          where you live.
        </p>
      </Section>

      <Section heading="Votes are final">
        <p>
          Once you vote on a match, that vote cannot be changed or withdrawn. We
          limit voting to roughly one vote per person per match using a signed
          cookie and a hashed network fingerprint.
        </p>
        <p>
          That fingerprint is imperfect in both directions, and we would rather
          say so than pretend otherwise: people sharing one network — an office,
          a campus, a phone carrier — may find they share a single vote. Equally,
          anyone determined to vote repeatedly can find a way. Results here are
          entertainment, not a poll with any statistical claim to accuracy.
        </p>
      </Section>

      <Section heading="What you create">
        <p>You keep ownership of what you upload. By creating a match you confirm:</p>
        <List
          items={[
            "You have the right to use the images you upload",
            "The content is not unlawful, hateful, harassing, or sexual content involving minors",
            "You are not impersonating a real person in a way meant to deceive",
            "You are not using a match to target or harass a private individual",
          ]}
        />
        <p>
          You grant us the licence needed to display and share your match —
          including in link previews and social cards — for as long as it exists
          on the service.
        </p>
      </Section>

      <Section heading="Real people as contenders">
        <p>
          Public figures are fair game; that is half the fun. Private individuals
          are not. A match built to mock, harass, or single out someone who is
          not a public figure will be removed, and repeat attempts will cost you
          your account.
        </p>
      </Section>

      <Section heading="Moderation">
        <p>
          We can remove any match and suspend any account that breaks these
          terms, without notice. We aim to be reasonable and to explain
          ourselves, but we do not guarantee a review process.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          Versus is provided as-is. Matches may end, results may be recalculated
          after abuse is found, and the service may be unavailable. Do not build
          anything that matters on top of these numbers.
        </p>
      </Section>

      <Section heading="A note on this document">
        <p>
          Written in plain language by the people who built the service, and not
          reviewed by a lawyer. If you are running Versus yourself, get terms
          reviewed for your jurisdiction.
        </p>
      </Section>
    </LegalPage>
  );
}
