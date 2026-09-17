import type { NextConfig } from "next";

/**
 * next/image refuses any remote host that isn't declared, so the bucket that
 * serves every contender portrait has to be listed here. Read from the env
 * rather than hardcoded so a different bucket (or a custom domain later)
 * needs no code change.
 */
function r2Host(): string | null {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = r2Host();

// This is read at BUILD time, and Vercel does not expose variables marked
// "Sensitive" to the build. When that happened the allow-list came out empty
// and every uploaded portrait silently 400'd through next/image — a failure
// with no error anywhere in the logs. Shout about it instead.
if (!host && process.env.NODE_ENV === "production") {
  console.warn(
    "\n  ⚠  R2_PUBLIC_URL is not set at build time — uploaded images will fail\n" +
      "     to load through next/image. On Vercel, make sure it is stored as a\n" +
      "     NON-SENSITIVE environment variable.\n",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/**" }]
      : [],
    // Portraits are square and rendered at a handful of fixed sizes.
    imageSizes: [96, 128, 200, 260, 400],
  },
};

export default nextConfig;
