import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);
await sql`drop schema public cascade`;
await sql`create schema public`;
await sql`drop schema if exists drizzle cascade`;
console.log("schema reset");
