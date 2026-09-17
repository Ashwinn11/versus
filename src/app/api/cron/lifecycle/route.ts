import { NextResponse, type NextRequest } from "next/server";

import { settleDueMatches } from "@/db/queries/lifecycle";
import { env } from "@/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily backstop.
 *
 * The app settles matches lazily on read, so this exists only to catch
 * matches that nobody has visited since they ended — otherwise they would
 * sit unsettled and never reach the Hall of Fame.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await settleDueMatches();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
