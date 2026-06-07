/**
 * src/__tests__/lib/logger/logger.test.ts
 *
 * What: Tests for the centralized logger.
 * Does: Verifies level gating, per-level emission and fields, enforced redaction of
 *       secret-like context keys, and Error-to-message reduction with no stack at info.
 * Use when: Guarding the logger's security-critical behavior (security skill: logging).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

// The logger transitively imports the server-only config module; neutralize the marker so the
// module graph loads under the node test environment.
vi.mock('server-only', () => ({}));

import { logger } from '@/lib/logger/logger';

// ─── Constants ───────────────────────────────────────────────
const TEST_MODULE = 'logger-test';
const TEST_OPERATION = 'emit';
const TEST_DESCRIPTION = 'a structured log line';
const RUN_ID = 'run-1234';
const REDACTED = '[redacted]';

const SECRET_TOKEN = 'super-secret-token-value';
const SECRET_API_KEY = 'sk-ant-not-a-real-key';
const SECRET_DSN = 'https://user:pass@sentry.example.com/42';
const ERROR_MESSAGE = 'something went wrong';

const ORIGINAL_LOG_LEVEL = process.env.LOG_LEVEL;

// ─── Helpers ─────────────────────────────────────────────────
function getLoggedLine(spy: MockInstance): string {
  const firstCall = spy.mock.calls[0];
  if (firstCall === undefined) {
    throw new Error('expected the logger to emit exactly one line');
  }
  return String(firstCall[0]);
}

function parseLoggedRecord(spy: MockInstance): Record<string, unknown> {
  return JSON.parse(getLoggedLine(spy)) as Record<string, unknown>;
}

// ─── Tests ───────────────────────────────────────────────────
afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_LOG_LEVEL === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = ORIGINAL_LOG_LEVEL;
  }
});

describe('logger level gating', () => {
  it('suppresses debug when LOG_LEVEL is info', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION);

    expect(spy).not.toHaveBeenCalled();
  });

  it('emits debug when LOG_LEVEL is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(parseLoggedRecord(spy).level).toBe('debug');
  });
});

describe('logger per-level emission', () => {
  it('error emits via console.error with the full call shape', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION, { runId: RUN_ID });

    expect(spy).toHaveBeenCalledTimes(1);
    const record = parseLoggedRecord(spy);
    expect(record.level).toBe('error');
    expect(record.module).toBe(TEST_MODULE);
    expect(record.operation).toBe(TEST_OPERATION);
    expect(record.description).toBe(TEST_DESCRIPTION);
    expect(record.context).toEqual({ runId: RUN_ID });
  });

  it('warn emits via console.warn with the full call shape', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION, { runId: RUN_ID });

    expect(spy).toHaveBeenCalledTimes(1);
    const record = parseLoggedRecord(spy);
    expect(record.level).toBe('warn');
    expect(record.module).toBe(TEST_MODULE);
    expect(record.operation).toBe(TEST_OPERATION);
    expect(record.description).toBe(TEST_DESCRIPTION);
    expect(record.context).toEqual({ runId: RUN_ID });
  });

  it('info emits via console.info with the full call shape', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION, { runId: RUN_ID });

    expect(spy).toHaveBeenCalledTimes(1);
    const record = parseLoggedRecord(spy);
    expect(record.level).toBe('info');
    expect(record.module).toBe(TEST_MODULE);
    expect(record.operation).toBe(TEST_OPERATION);
    expect(record.description).toBe(TEST_DESCRIPTION);
    expect(record.context).toEqual({ runId: RUN_ID });
  });
});

describe('logger redaction', () => {
  it('redacts secret-like context keys and never emits the raw value', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION, {
      token: SECRET_TOKEN,
      apiKey: SECRET_API_KEY,
      dsn: SECRET_DSN,
      ANTHROPIC_API_KEY: SECRET_API_KEY,
      runId: RUN_ID,
    });

    const line = getLoggedLine(spy);
    const record = JSON.parse(line) as Record<string, unknown>;
    const context = record.context as Record<string, unknown>;

    expect(context.token).toBe(REDACTED);
    expect(context.apiKey).toBe(REDACTED);
    expect(context.dsn).toBe(REDACTED);
    expect(context.ANTHROPIC_API_KEY).toBe(REDACTED);
    expect(context.runId).toBe(RUN_ID);

    expect(line).not.toContain(SECRET_TOKEN);
    expect(line).not.toContain(SECRET_API_KEY);
    expect(line).not.toContain(SECRET_DSN);
  });
});

describe('logger Error handling', () => {
  it('logs an Error context value as its message only, with no stack at info level', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error(TEST_MODULE, TEST_OPERATION, TEST_DESCRIPTION, {
      error: new Error(ERROR_MESSAGE),
    });

    const line = getLoggedLine(spy);
    const record = JSON.parse(line) as Record<string, unknown>;
    const context = record.context as Record<string, unknown>;

    expect(context.error).toBe(ERROR_MESSAGE);
    expect(typeof context.error).toBe('string');
    expect(line).not.toContain('stack');
  });
});
