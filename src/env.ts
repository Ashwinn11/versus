import "server-only";

import { SITE_URL } from "@/lib/site";

/**
 * Fails loudly at first access rather than surfacing as a confusing runtime
 * error deep inside a query or an OAuth callback.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get BETTER_AUTH_SECRET() {
    return required("BETTER_AUTH_SECRET");
  },
  /**
   * Derived from the site origin rather than set by hand.
   *
   * These two must agree or the OAuth callback lands on a different host than
   * the one that started the flow and the sign-in silently fails. Vercel
   * supplies VERCEL_PROJECT_PRODUCTION_URL, so a deployment configures itself
   * and cannot drift from the domain it is actually served on.
   */
  get BETTER_AUTH_URL() {
    return process.env.BETTER_AUTH_URL || SITE_URL;
  },
  get GOOGLE_CLIENT_ID() {
    return optional("GOOGLE_CLIENT_ID");
  },
  get GOOGLE_CLIENT_SECRET() {
    return optional("GOOGLE_CLIENT_SECRET");
  },
  get R2_ACCOUNT_ID() {
    return optional("R2_ACCOUNT_ID");
  },
  get R2_BUCKET() {
    return optional("R2_BUCKET");
  },
  get R2_ACCESS_KEY_ID() {
    return optional("R2_ACCESS_KEY_ID");
  },
  get R2_SECRET_ACCESS_KEY() {
    return optional("R2_SECRET_ACCESS_KEY");
  },
  get R2_PUBLIC_URL() {
    return optional("R2_PUBLIC_URL")?.replace(/\/$/, "");
  },
  get VOTE_SECRET() {
    return required("VOTE_SECRET");
  },
  get IP_HASH_SALT() {
    return required("IP_HASH_SALT");
  },
  get CRON_SECRET() {
    return required("CRON_SECRET");
  },
};

/** Uploads are only wired up once every R2 credential is present. */
export function isUploadConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_BUCKET &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_PUBLIC_URL,
  );
}

/** Google sign-in is hidden rather than broken when unconfigured. */
export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
