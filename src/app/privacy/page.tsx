import type { Metadata } from "next";

import { LegalPage, List, Section } from "@/components/legal-page";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy",
  description: "What Versus collects, why, and what it never stores.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="17 September 2026"
      intro="Versus collects the least it can get away with. Voting needs no account, and the parts that do collect something are listed here in full."
    >
      <Section heading="Voting anonymously">
        <p>
          You do not need an account to vote. When you cast your first vote we
          set one cookie, <code className="rounded bg-sand px-1.5 py-0.5 text-sm">vs_vk</code>,
          containing a random identifier signed by our server. It exists only to
          stop the same person voting twice on one match. It is not an
          advertising identifier, it is never shared, and it is not used to build
          a profile of you.
        </p>
        <p>
          Alongside it we store a salted, one-way hash of your IP address and
          browser user-agent. We do this so that clearing cookies or switching
          browser does not hand one person unlimited votes. These are hashes: we
          cannot reverse them back into your IP address, and we never store the
          address itself.
        </p>
      </Section>

      <Section heading="If you sign in">
        <p>
          Creating a match requires signing in with Google. From Google we
          receive and store only:
        </p>
        <List
          items={[
            "Your name, as it appears on your Google account",
            "Your email address",
            "Your profile picture URL",
          ]}
        />
        <p>
          We do not receive your Google password, and we request no access to
          your Gmail, Drive, contacts or calendar.
        </p>
      </Section>

      <Section heading="What you publish">
        <p>
          Matches are public by design — the entire point is a shareable link.
          Anything you put into a match (the question, contender names,
          nicknames, images, attributes) is visible to anyone with that link,
          and may be surfaced on category pages, the Hall of Fame, and in link
          previews on other platforms.
        </p>
        <p>
          Images you upload are stored on Cloudflare R2 and served from a public
          URL. Do not upload anything you would not want shown publicly.
        </p>
      </Section>

      <Section heading="Deleting your account">
        <p>
          You can delete your account at any time from the account menu. This
          removes your account, your sign-in sessions, and your connection to
          Google.
        </p>
        <p>
          Matches you created are <strong className="text-ink">not</strong>{" "}
          deleted — they are unlinked from you and remain as authorless. This is
          deliberate: other people have voted on those matches, and deleting one
          would destroy their votes along with yours. If you need a specific
          match removed entirely, get in touch.
        </p>
      </Section>

      <Section heading="What we don't do">
        <List
          items={[
            "No third-party advertising or tracking pixels",
            "No selling or sharing of personal data",
            "No storing of raw IP addresses",
            "No email marketing — we do not send you anything",
          ]}
        />
      </Section>

      <Section heading="A note on this document">
        <p>
          This describes what the software actually does, written by the people
          who built it. It is not legal advice and has not been reviewed by a
          lawyer. If you are deploying Versus yourself, have this reviewed
          against the law that applies to you.
        </p>
      </Section>
    </LegalPage>
  );
}
