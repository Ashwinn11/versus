import type { MatchSummary } from "@/db/queries/matches";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * JSON-LD is rendered server-side into the HTML on purpose.
 *
 * Plenty of sites inject it from client JavaScript and then wonder why it
 * never produces a rich result — many crawlers read the raw response.
 */
function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own serialised object, not user HTML. Angle
      // brackets are escaped so a contender named "<script>" cannot break out
      // of the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function SiteStructuredData() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      }}
    />
  );
}

/**
 * A match is modelled as a `Question` with two `Answer`s.
 *
 * This is not a stretch to game search: a match literally is one question with
 * two candidate answers and a vote count on each, which maps exactly onto
 * `suggestedAnswer` + `upvoteCount`. A settled match promotes its winner to
 * `acceptedAnswer`, which is what the crowd decided.
 */
export function MatchStructuredData({ match }: { match: MatchSummary }) {
  const url = absoluteUrl(`/m/${match.slug}`);

  const answer = (c: MatchSummary["a"]) => ({
    "@type": "Answer",
    text: c.name,
    upvoteCount: c.voteCount,
    url,
  });

  const winner =
    match.winnerMatchContenderId === match.a.id
      ? match.a
      : match.winnerMatchContenderId === match.b.id
        ? match.b
        : null;

  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "QAPage",
        mainEntity: {
          "@type": "Question",
          name: match.question,
          text: `${match.a.name} vs. ${match.b.name} — ${match.question}`,
          answerCount: 2,
          upvoteCount: match.totalVotes,
          dateCreated: match.startsAt?.toISOString(),
          url,
          suggestedAnswer: [answer(match.a), answer(match.b)],
          ...(winner ? { acceptedAnswer: answer(winner) } : {}),
        },
      }}
    />
  );
}
