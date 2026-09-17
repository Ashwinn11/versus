import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const [slug, side, countArg] = process.argv.slice(2);
const count = Number(countArg ?? 10);

const [row] = await sql`
  select mc.id from match_contenders mc
  join matches m on m.id = mc.match_id
  where m.slug = ${slug} and mc.side = ${side}`;
if (!row) throw new Error(`no side ${side} on ${slug}`);

let ok = 0;
for (let i = 0; i < count; i++) {
  // No cookie is sent, so each request mints a fresh voter key — a distinct
  // person. The forwarded IP varies because dedupe and rate limiting are both
  // keyed on it; reusing one address would (correctly) count a single vote.
  const res = await fetch(`http://localhost:3000/api/matches/${slug}/vote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `198.51.100.${i % 250}`,
    },
    body: JSON.stringify({ matchContenderId: row.id }),
  });
  if (res.ok) ok++;
  await new Promise((r) => setTimeout(r, 100));
}
console.log(`cast ${ok}/${count} votes on side ${side} of ${slug}`);
