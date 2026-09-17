import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

import { env, isUploadConfigured } from "@/env";

/**
 * Objects are immutable: every key is unique, so a URL's bytes never change
 * and can be cached forever. This is set by the client on the PUT, since
 * content-type and cache-control are not part of the presigned signature.
 */
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

let client: S3Client | undefined;

function s3() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Signs a short-lived PUT so bytes go browser → R2 without touching us. */
export async function presignUpload(contentType: string) {
  if (!isUploadConfigured()) throw new Error("Uploads are not configured");

  const ext = contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp";
  const key = `contenders/${nanoid(16)}-${Date.now()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: 120 },
  );

  return { uploadUrl, publicUrl: `${env.R2_PUBLIC_URL}/${key}`, key };
}

/**
 * True only for a URL on our own bucket.
 *
 * This is load-bearing, not tidiness: `imageUrl` arrives from the client, so
 * without this check a crafted create request could point a contender's
 * portrait at any third-party host and use the arena to serve or track
 * whatever it liked. Anything failing this is stored as null instead.
 */
export function isManagedImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = env.R2_PUBLIC_URL;
  return Boolean(base) && url.startsWith(`${base}/`);
}
