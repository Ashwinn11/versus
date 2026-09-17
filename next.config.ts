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
