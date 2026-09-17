import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);

const tables = await sql`
  select tablename from pg_tables where schemaname = 'public' order by 1`;
console.log("tables:", tables.map((r) => r.tablename).join(", "));

const idx = await sql`
  select count(*)::int n from pg_indexes where schemaname = 'public'`;
console.log("indexes:", idx[0].n);
