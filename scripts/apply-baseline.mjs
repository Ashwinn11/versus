/**
 * One-shot: brings the live database in line with the squashed baseline.
 *
 * Run once, then delete this file.
 *
 *   node --env-file=.env.local scripts/apply-baseline.mjs
 *
 * Two things have to happen together, or drizzle is left disagreeing with the
 * database it just migrated:
 *
 *   1. The live database still carries the objects migration 0003 would have
 *      dropped (the `tags` taxonomy, `match_contenders.answer`,
 *      `matches.decided_by`, and 'draft' in the match_status enum). Those come
 *      off here, in the order that survives the enum rebuild.
 *
 *   2. The migration ledger still lists the four original migrations, whose
 *      files no longer exist. It is replaced with the single baseline, marked
 *      as already applied — the baseline's DDL must NOT run against this
 *      database, because these tables already exist and hold real rows
 *      (15 categories, your account, the visitor counter).
 *
 * Everything is one transaction: a failure anywhere rolls the whole thing back
 * and leaves the database exactly as it was.
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const hash = createHash("sha256")
  .update(readFileSync("drizzle/0000_baseline.sql"))
  .digest("hex");
const { when } = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
).entries[0];

// DDL wants the direct connection: PgBouncer in transaction mode cannot carry
// the session state it relies on.
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});

const client = await pool.connect();
try {
  await client.query("BEGIN");

  // --- 1. what migration 0003 would have done -----------------------------
  await client.query(`DROP TABLE IF EXISTS "match_tags" CASCADE`);
  await client.query(`DROP TABLE IF EXISTS "tags" CASCADE`);

  // The column default has to come off before the type can be rebuilt, and
  // any surviving 'draft' row has to be normalised while the column is still
  // free-form text — otherwise the cast back aborts the whole migration.
  await client.query(`ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT`);
  await client.query(`ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE text`);
  const { rowCount: drafts } = await client.query(
    `UPDATE "matches" SET "status" = 'scheduled' WHERE "status" = 'draft'`,
  );
  await client.query(`DROP TYPE IF EXISTS "public"."match_status"`);
  await client.query(
    `CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'ended')`,
  );
  await client.query(
    `ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE "public"."match_status" USING "status"::"public"."match_status"`,
  );
  await client.query(
    `ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
  );

  await client.query(`ALTER TABLE "match_contenders" DROP COLUMN IF EXISTS "answer"`);
  await client.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "decided_by"`);
  await client.query(`DROP TYPE IF EXISTS "public"."decided_by"`);

  // --- 2. replace the ledger with the one baseline ------------------------
  await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await client.query(`DELETE FROM drizzle.__drizzle_migrations`);
  await client.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
    [hash, when],
  );

  await client.query("COMMIT");
  console.log(`committed (normalised ${drafts} draft row(s))`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("rolled back, database unchanged:", err.message);
  process.exit(1);
} finally {
  client.release();
}

// --- verify against the database rather than trusting the writes -----------
const check = await pool.query(`
  select
    (select count(*) from information_schema.tables
       where table_schema='public' and table_name in ('tags','match_tags'))        as dead_tables,
    (select count(*) from information_schema.columns
       where table_schema='public'
         and ((table_name='match_contenders' and column_name='answer')
           or (table_name='matches' and column_name='decided_by')))                as dead_columns,
    (select string_agg(e.enumlabel, ',' order by e.enumsortorder)
       from pg_enum e join pg_type t on t.oid=e.enumtypid
       where t.typname='match_status')                                             as match_status,
    (select column_default from information_schema.columns
       where table_schema='public' and table_name='matches'
         and column_name='status')                                                 as status_default,
    (select count(*) from drizzle.__drizzle_migrations)                            as ledger_rows,
    (select hash from drizzle.__drizzle_migrations limit 1)                        as ledger_hash,
    (select count(*) from categories)                                              as categories,
    (select count(*) from "user")                                                  as users`);

const r = check.rows[0];
console.table({
  "dead tables remaining": r.dead_tables,
  "dead columns remaining": r.dead_columns,
  "match_status enum": r.match_status,
  "status default": r.status_default,
  "ledger rows": r.ledger_rows,
  "ledger hash matches baseline": r.ledger_hash === hash,
  "categories preserved": r.categories,
  "users preserved": r.users,
});

await pool.end();
