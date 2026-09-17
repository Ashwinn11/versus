import { eq } from "drizzle-orm";

import { db } from "@/db";
import { matches } from "@/db/schema";
import { subscribe } from "@/lib/live/registry";

/** Node runtime: the registry keeps a module-level poller across connections. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel caps function duration; close cleanly just under it and let the
 *  browser's own EventSource retry reconnect. */
export const maxDuration = 300;

const HEARTBEAT_MS = 20_000;
const LIFETIME_MS = 280_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [match] = await db
    .select({ id: matches.id, status: matches.status })
    .from(matches)
    .where(eq(matches.slug, slug))
    .limit(1);

  if (!match) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
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

      const { unsubscribe, current } = subscribe(match.id, (t) =>
        send("tallies", t),
      );
      if (current) send("tallies", current);

      // Comment frames keep proxies from treating an idle stream as dead.
      const heartbeat = setInterval(() => {
        if (closed) return;
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

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Nginx and some CDNs buffer by default, which defeats streaming.
      "x-accel-buffering": "no",
    },
  });
}
