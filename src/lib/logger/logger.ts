/**
 * src/lib/logger/logger.ts
 *
 * What: The centralized structured logger — the single module permitted to call `console`.
 * Does: Emits one JSON line per call at a config-gated level, redacting secret-like context
 *       keys and reducing Error values to their message (stack only at debug level).
 * Use when: Anywhere code needs to log. Never call `console` directly elsewhere
 *           (security skill: all logging goes through the centralized logger).
 */

import { getLogLevel } from '@/lib/config/env';

// ─── Types ───────────────────────────────────────────────────
/** The supported log levels, derived from the priority table so the two never drift. */
export type LogLevel = keyof typeof LEVEL_PRIORITY;

/** Structured context attached to a log line; keys matching secret names are redacted. */
type LogContext = Record<string, unknown>;

/** One method per level; all share the same call shape. */
type LogMethod = (
  module: string,
  operation: string,
  description: string,
  context?: LogContext
) => void;

export type Logger = Record<LogLevel, LogMethod>;

/** The exact, ordered shape of an emitted JSON line. */
type LogRecord = {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly module: string;
  readonly operation: string;
  readonly description: string;
  readonly context?: LogContext;
};

// ─── Constants ───────────────────────────────────────────────
/** Lower number = higher severity. A message emits when its priority <= the configured level's. */
const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

/** Replacement value for any redacted secret. The raw value is never serialized. */
const REDACTED = '[redacted]';

/** Exact context-key names (compared case-insensitively) whose values are always redacted. */
const SENSITIVE_KEY_NAMES: ReadonlySet<string> = new Set([
  'apikey',
  'token',
  'authorization',
  'secret',
  'password',
  'jwt',
  'dsn',
]);

/** Any key ending in this suffix (case-insensitive) is treated as a secret — matches `*_KEY`. */
const SENSITIVE_KEY_SUFFIX = '_key';

/** Routes each level to its console method — the only console calls in the codebase. */
const CONSOLE_METHOD: Record<LogLevel, (line: string) => void> = {
  error: (line) => console.error(line),
  warn: (line) => console.warn(line),
  info: (line) => console.info(line),
  debug: (line) => console.debug(line),
};

// ─── Helpers ─────────────────────────────────────────────────
/**
 * Decides whether a message at the given level clears the configured threshold.
 *
 * @param level - The level the caller is logging at.
 * @returns True when the message should be emitted.
 * @throws {never}
 */
function shouldEmit(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[getLogLevel()];
}

/**
 * Reports whether a context key names a secret and so must be redacted.
 *
 * @param key - The context key.
 * @returns True for known secret names or any `*_KEY` key.
 * @throws {never}
 */
function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_NAMES.has(normalized) || normalized.endsWith(SENSITIVE_KEY_SUFFIX);
}

/**
 * Reduces a single context value to a safe, serializable form. Errors collapse to their
 * message, plus a stack only at debug level; all other values pass through unchanged.
 *
 * @param value - The raw context value.
 * @param level - The level being logged at, which gates stack exposure.
 * @returns The sanitized value.
 * @throws {never}
 */
function sanitizeValue(value: unknown, level: LogLevel): unknown {
  if (value instanceof Error) {
    return level === 'debug' ? { message: value.message, stack: value.stack } : value.message;
  }
  return value;
}

/**
 * Builds a sanitized copy of the context: secret-named keys are redacted, Error values are
 * reduced to their message. Redaction wins over Error handling.
 *
 * @param context - The caller-supplied context.
 * @param level - The level being logged at.
 * @returns A new context object safe to serialize.
 * @throws {never}
 */
function sanitizeContext(context: LogContext, level: LogLevel): LogContext {
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = isSensitiveKey(key) ? REDACTED : sanitizeValue(value, level);
  }
  return sanitized;
}

/**
 * Emits one structured JSON line for a single log call, after level gating and sanitization.
 *
 * @param level - The severity level.
 * @param module - The module name the call originates from.
 * @param operation - The operation being performed.
 * @param description - A human-readable description of the event.
 * @param context - Optional structured context; secrets are redacted before emission.
 * @returns Nothing.
 * @throws {never}
 */
function emit(
  level: LogLevel,
  module: string,
  operation: string,
  description: string,
  context?: LogContext
): void {
  if (!shouldEmit(level)) {
    return;
  }
  const record: LogRecord = {
    timestamp: new Date().toISOString(),
    level,
    module,
    operation,
    description,
    ...(context !== undefined ? { context: sanitizeContext(context, level) } : {}),
  };
  CONSOLE_METHOD[level](JSON.stringify(record));
}

// ─── Logger ──────────────────────────────────────────────────
/**
 * The centralized logger. Each method emits one structured JSON line at its level, subject to
 * the configured threshold, with secret-like context keys redacted and Errors reduced to their
 * message. This is the only module permitted to call `console`.
 *
 * @example logger.info('aver-client', 'assess', 'sent record to Aver', { runId });
 */
export const logger: Logger = {
  error: (module, operation, description, context) =>
    emit('error', module, operation, description, context),
  warn: (module, operation, description, context) =>
    emit('warn', module, operation, description, context),
  info: (module, operation, description, context) =>
    emit('info', module, operation, description, context),
  debug: (module, operation, description, context) =>
    emit('debug', module, operation, description, context),
};
