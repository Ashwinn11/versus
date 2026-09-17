import { VOTER_COOKIE, getVoterIdentity } from "@/lib/voter";
import {
  currentStats,
  releaseVisitor,
  subscribeToStats,
  touchVisitor,
} from "@/lib/live/site-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const HEARTBEAT_MS = 20_000;
const LIFETIME_MS = 280_000;

/**
 * Live site stats, where the connection itself is the presence signal.
 *
 * An open stream means the person is on the site, so there is no separate
 * heartbeat request to run on a timer: connecting marks them present, the
 * stream keeps them present, and closing it takes them offline immediately.
 */
export async function GET(request: Request) {
  const { key: voterKey, freshToken } = await getVoterIdentity();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      await touchVisitor(voterKey);

      const unsubscribe = subscribeToStats((s) => send("stats", s));
      const seeded = currentStats();
      if (seeded) send("stats", seeded);

      // Refreshing last_seen keeps a long-lived connection from ageing out of
      // the online window; the comment frame stops proxies killing an idle
      // stream.
      const heartbeat = setInterval(() => {
        if (closed) return;
        void touchVisitor(voterKey);
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
        }
      }, HEARTBEAT_MS);

      const shutdown = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        unsubscribe();
        // Best effort: if this fails the visitor simply ages out normally.
        void releaseVisitor(voterKey).catch(() => {});
        try {
          controller.close();
        } catch {
          // Already torn down by the runtime.
        }
      };

      const lifetime = setTimeout(shutdown, LIFETIME_MS);
      request.signal.addEventListener("abort", shutdown);
    },
  });

  const headers = new Headers({
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  if (freshToken) {
    headers.append(
      "set-cookie",
      `${VOTER_COOKIE.name}=${freshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${VOTER_COOKIE.options.maxAge}${VOTER_COOKIE.options.secure ? "; Secure" : ""}`,
    );
  }

  return new Response(stream, { headers });
}
