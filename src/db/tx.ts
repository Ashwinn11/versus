import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "@/env";
import * as schema from "./schema";

// The HTTP driver can't hold a transaction open across statements, so anything
// that has to be atomic uses a real pooled connection over WebSocket. Node has
// no global WebSocket in every runtime we target, so supply one.
neonConfig.webSocketConstructor = ws;

let pool: Pool | undefined;

/**
 * Lazily created and cached on the module, so a warm lambda reuses one pool
 * across invocations instead of opening a connection per request.
 */
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL, max: 4 });
  }
  return pool;
}

/** Drizzle client that supports `.transaction()`. Use only when you need it. */
export function txDb() {
  return drizzle(getPool(), { schema });
}
