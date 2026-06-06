/**
 * src/lib/config/public-env.ts
 *
 * What: The single typed accessor for client-safe (PUBLIC) environment variables.
 * Does: Reads NEXT_PUBLIC_* values that are inlined into the client bundle, degrading
 *       gracefully (undefined) when unset. Strictly separate from the server-only env
 *       module — nothing here is a secret, and nothing secret may ever be added here.
 * Use when: Client-side code needs a public config value (e.g. the Sentry DSN for the
 *           browser SDK). Never import the server-only env module from the client.
 */

/**
 * Returns the Sentry DSN for client-side error tracking, if configured.
 *
 * @returns The DSN, or undefined when unset — the browser SDK then no-ops.
 * @throws {never}
 */
export function getPublicSentryDsn(): string | undefined {
  // Statically referenced so Next.js inlines it into the client bundle at build time.
  const value = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value;
}
