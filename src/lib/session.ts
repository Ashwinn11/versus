import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/** The signed-in user in a server component or route handler, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
