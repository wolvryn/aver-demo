import 'server-only';

/**
 * src/lib/config/env.ts
 *
 * What: The single typed, server-only accessor for environment variables.
 * Does: Reads and validates server secrets and server-side config through one place;
 *       required values fail loudly when missing, optional values degrade gracefully.
 * Use when: Any server-side module needs a credential or service URL — call these
 *           accessors, never `process.env` directly (security skill: no scattered env reads).
 */

// ─── Types ───────────────────────────────────────────────────
export type SourceApiConfig = {
  readonly apiKey: string;
  readonly baseUrl: string | undefined;
};

export type AverServiceConfig = {
  readonly url: string;
  readonly token: string;
};

// ─── Helpers ─────────────────────────────────────────────────
/**
 * Reads a required server-side variable, failing loudly if it is missing or blank.
 *
 * @param name - The environment variable name.
 * @returns The trimmed value.
 * @throws {Error} When the variable is undefined or empty.
 */
function readRequired(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local (see .env.example).`
    );
  }
  return value;
}

/**
 * Reads an optional variable, returning undefined when missing or blank.
 *
 * @param name - The environment variable name.
 * @returns The value, or undefined when unset — callers degrade gracefully.
 * @throws {never}
 */
function readOptional(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value;
}

// ─── Accessors ───────────────────────────────────────────────
/**
 * Returns the Anthropic API key used for live agent generation.
 *
 * @returns The API key.
 * @throws {Error} When ANTHROPIC_API_KEY is unset.
 */
export function getAnthropicApiKey(): string {
  return readRequired('ANTHROPIC_API_KEY');
}

/**
 * Returns the source-collection API credentials and optional base URL.
 *
 * @returns The source API config; baseUrl is undefined when unset.
 * @throws {Error} When SOURCE_API_KEY is unset.
 */
export function getSourceApiConfig(): SourceApiConfig {
  return {
    apiKey: readRequired('SOURCE_API_KEY'),
    baseUrl: readOptional('SOURCE_API_BASE_URL'),
  };
}

/**
 * Returns the Aver service URL and bearer token. Server-only; never reaches the browser.
 *
 * @returns The Aver service config.
 * @throws {Error} When AVER_SERVICE_URL or AVER_SERVICE_TOKEN is unset.
 */
export function getAverServiceConfig(): AverServiceConfig {
  return {
    url: readRequired('AVER_SERVICE_URL'),
    token: readRequired('AVER_SERVICE_TOKEN'),
  };
}

/**
 * Returns the Sentry DSN for server/edge error tracking, if configured.
 *
 * @returns The DSN, or undefined when unset — error tracking then no-ops.
 * @throws {never}
 */
export function getSentryDsn(): string | undefined {
  return readOptional('NEXT_PUBLIC_SENTRY_DSN');
}
