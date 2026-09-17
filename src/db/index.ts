import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * The HTTP driver, used for everything that is a single round trip. It has no
 * connection to keep alive, which is exactly what a serverless function wants.
 *
 * Multi-statement work that must be atomic (casting a vote) goes through
 * `db.transaction()` on the pooled client in `./tx.ts` instead — neon-http
 * cannot hold a transaction open across statements.
 */
export const db = drizzle(neon(env.DATABASE_URL), { schema });

export { schema };
