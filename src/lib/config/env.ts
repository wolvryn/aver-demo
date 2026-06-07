import 'server-only';

import type { LogLevel } from '@/lib/logger/logger';

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
export type AverServiceConfig = {
  readonly url: string;
  readonly token: string;
};

// ─── Constants ───────────────────────────────────────────────
/** Supported log levels, in severity order. Typed against LogLevel so the set stays in sync. */
const VALID_LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'info', 'debug'];

/** Production-safe default — never silently 'debug' (security skill: log level defaults to info). */
const DEFAULT_LOG_LEVEL: LogLevel = 'info';

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

/**
 * Type guard narrowing a raw string to a known LogLevel.
 *
 * @param value - The candidate level string.
 * @returns True when value is one of the supported log levels.
 * @throws {never}
 */
function isLogLevel(value: string): value is LogLevel {
  return VALID_LOG_LEVELS.some((level) => level === value);
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
 * Returns the Finnhub API key used by the source-collection seam to fetch live quotes.
 * Server-only; never exposed to the browser.
 *
 * @returns The Finnhub API key.
 * @throws {Error} When FINNHUB_API_KEY is unset.
 */
export function getFinnhubApiKey(): string {
  return readRequired('FINNHUB_API_KEY');
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

/**
 * Returns the configured log level. CONFIG, non-secret: defaults to 'info' when unset or
 * unrecognized and never silently becomes 'debug' in production.
 *
 * @returns The validated log level, or 'info' by default.
 * @throws {never}
 */
export function getLogLevel(): LogLevel {
  const value = readOptional('LOG_LEVEL');
  if (value === undefined) {
    return DEFAULT_LOG_LEVEL;
  }
  const normalized = value.trim().toLowerCase();
  return isLogLevel(normalized) ? normalized : DEFAULT_LOG_LEVEL;
}
