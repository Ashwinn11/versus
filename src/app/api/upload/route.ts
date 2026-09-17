import { NextResponse } from "next/server";
import { z } from "zod";

import { isUploadConfigured } from "@/env";
import { presignUpload } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const schema = z.object({
  contentType: z.enum(["image/webp", "image/jpeg", "image/png"]),
});

/** Auth-gated: uploading is part of creating, which requires an account. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });
  }
  if (!isUploadConfigured()) {
    return NextResponse.json(
      { error: "Image uploads aren't configured yet." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`upload:${session.user.id}`, { limit: 30, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const { uploadUrl, publicUrl } = await presignUpload(parsed.data.contentType);
  return NextResponse.json({ uploadUrl, publicUrl });
}
