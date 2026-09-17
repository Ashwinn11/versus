import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/session";

/**
 * Deletes the signed-in account.
 *
 * Every FK from `user` is declared on delete cascade (sessions, accounts) or
 * set null (matches, contenders, votes), so one delete is enough and nothing
 * is left pointing at a row that no longer exists. Matches deliberately
 * survive as authorless rather than vanishing — people have already voted on
 * them, and silently deleting a live match would erase their votes too.
 */
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await db.delete(user).where(eq(user.id, session.user.id));

  // Clear the cookie as well, so the browser isn't left holding a token for
  // a session row that has just been cascaded away.
  const response = NextResponse.json({ ok: true });
  for (const name of ["better-auth.session_token", "better-auth.session_data"]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
