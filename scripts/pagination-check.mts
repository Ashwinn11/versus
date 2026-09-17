/** Proves keyset pagination returns each row exactly once, with no overlap. */
const seen: string[] = [];
let cursor: string | null = null;
let page = 0;

do {
  const url = new URL("http://localhost:3000/api/matches");
  url.searchParams.set("limit", "4");
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url);
  const data = (await res.json()) as {
    items: { id: string; title: string }[];
    nextCursor: string | null;
  };
  page++;
  console.log(`page ${page}: ${data.items.length} items | cursor ${cursor ? "yes" : "none"}`);
  for (const m of data.items) console.log(`    ${m.title}`);
  seen.push(...data.items.map((m) => m.id));
  cursor = data.nextCursor;
} while (cursor && page < 10);

const unique = new Set(seen);
console.log(`\ntotal rows returned: ${seen.length}`);
console.log(`unique rows:         ${unique.size}`);
console.log(unique.size === seen.length ? "PASS — no duplicates across pages" : "FAIL — pages overlap");
