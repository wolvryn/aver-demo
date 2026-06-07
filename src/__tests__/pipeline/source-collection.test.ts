/**
 * src/__tests__/pipeline/source-collection.test.ts
 *
 * What: Tests for the Finnhub source-collection adapter (the source seam).
 * Does: Verifies normalized happy-path collection, the per-symbol TTL cache (hit and expiry),
 *       the 429/no-cache error paths, and zeroed/no-data handling — all with Finnhub mocked
 *       at the HTTP boundary (the real network is never touched).
 * Use when: Guarding collection behavior and the free-tier-quota protections.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The module transitively imports the server-only config; neutralize the marker so the module
// graph loads under the node test environment.
vi.mock('server-only', () => ({}));

// ─── Constants ───────────────────────────────────────────────
const TEST_API_KEY = 'test-finnhub-key';
const CACHE_TTL_MS = 60_000;

const BASKET_SIZE = 5;
const PRIMARY_SYMBOL = 'AAPL';

/** A well-formed Finnhub `/quote` body for a symbol that has data. */
const VALID_FINNHUB_BODY = {
  c: 100.25,
  d: 1.5,
  dp: 1.52,
  h: 101,
  l: 98.75,
  o: 99,
  pc: 98.75,
  t: 1_700_000_000,
} as const;

/** Finnhub's zeroed body for an unknown symbol — must never become a real quote. */
const NO_DATA_FINNHUB_BODY = {
  c: 0,
  d: 0,
  dp: 0,
  h: 0,
  l: 0,
  o: 0,
  pc: 0,
  t: 0,
} as const;

const HTTP_TOO_MANY_REQUESTS = 429;
const CLEAN_ERROR_FRAGMENT = 'Unable to collect a quote';

// ─── Helpers ─────────────────────────────────────────────────
type FetchResult = { ok: boolean; status: number; json: () => Promise<unknown> };

function okJson(body: unknown): FetchResult {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number): FetchResult {
  return { ok: false, status, json: async () => ({}) };
}

/** Installs a fresh fetch mock as the global and returns it for per-test configuration. */
function stubFetch(
  implementation: (url: string) => Promise<FetchResult>
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Loads a fresh copy of the module so each test starts with an empty in-memory cache. */
async function loadFreshModule(): Promise<typeof import('@/pipeline/source-collection')> {
  vi.resetModules();
  return import('@/pipeline/source-collection');
}

// ─── Lifecycle ───────────────────────────────────────────────
beforeEach(() => {
  vi.useFakeTimers();
  process.env.FINNHUB_API_KEY = TEST_API_KEY;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.FINNHUB_API_KEY;
});

// ─── Tests ───────────────────────────────────────────────────
describe('collectBasketQuotes happy path', () => {
  it('returns one normalized quote per basket symbol', async () => {
    const fetchMock = stubFetch(async () => okJson({ ...VALID_FINNHUB_BODY }));
    const { collectBasketQuotes, DEMO_BASKET } = await loadFreshModule();

    const quotes = await collectBasketQuotes();

    expect(quotes).toHaveLength(BASKET_SIZE);
    expect(quotes.map((quote) => quote.symbol)).toEqual([...DEMO_BASKET]);
    expect(fetchMock).toHaveBeenCalledTimes(BASKET_SIZE);

    const first = quotes[0];
    if (first === undefined) {
      throw new Error('expected at least one quote');
    }
    expect(first.symbol).toBe(PRIMARY_SYMBOL);
    expect(first.price).toBe(VALID_FINNHUB_BODY.c);
    expect(first.change).toBe(VALID_FINNHUB_BODY.d);
    expect(first.percentChange).toBe(VALID_FINNHUB_BODY.dp);
    expect(first.high).toBe(VALID_FINNHUB_BODY.h);
    expect(first.low).toBe(VALID_FINNHUB_BODY.l);
    expect(first.previousClose).toBe(VALID_FINNHUB_BODY.pc);
    expect(first.asOf).toBe(new Date(VALID_FINNHUB_BODY.t * 1000).toISOString());
  });
});

describe('collectBasketQuotes caching', () => {
  it('serves the second call within TTL from cache without re-fetching', async () => {
    const fetchMock = stubFetch(async () => okJson({ ...VALID_FINNHUB_BODY }));
    const { collectBasketQuotes } = await loadFreshModule();

    await collectBasketQuotes();
    await collectBasketQuotes();

    expect(fetchMock).toHaveBeenCalledTimes(BASKET_SIZE);
  });

  it('re-fetches after the TTL has elapsed', async () => {
    const fetchMock = stubFetch(async () => okJson({ ...VALID_FINNHUB_BODY }));
    const { collectBasketQuotes } = await loadFreshModule();

    await collectBasketQuotes();
    vi.advanceTimersByTime(CACHE_TTL_MS);
    await collectBasketQuotes();

    expect(fetchMock).toHaveBeenCalledTimes(BASKET_SIZE * 2);
  });
});

describe('collectBasketQuotes error handling', () => {
  it('serves the last-good cached quote when a refresh returns 429', async () => {
    const fetchMock = stubFetch(async () => okJson({ ...VALID_FINNHUB_BODY }));
    const { collectBasketQuotes } = await loadFreshModule();

    const fresh = await collectBasketQuotes();

    // Expire the cache, then make every refresh rate-limited.
    fetchMock.mockImplementation(async () => errorResponse(HTTP_TOO_MANY_REQUESTS));
    vi.advanceTimersByTime(CACHE_TTL_MS);

    const fallback = await collectBasketQuotes();

    expect(fallback).toEqual(fresh);
    expect(fetchMock).toHaveBeenCalledTimes(BASKET_SIZE * 2);
  });

  it('throws a clean error when a 429 occurs with no cached fallback', async () => {
    stubFetch(async () => errorResponse(HTTP_TOO_MANY_REQUESTS));
    const { collectBasketQuotes } = await loadFreshModule();

    await expect(collectBasketQuotes()).rejects.toThrow(CLEAN_ERROR_FRAGMENT);
  });
});

describe('collectBasketQuotes no-data handling', () => {
  it('treats a zeroed/no-data response as no quote rather than returning it', async () => {
    stubFetch(async () => okJson({ ...NO_DATA_FINNHUB_BODY }));
    const { collectBasketQuotes } = await loadFreshModule();

    await expect(collectBasketQuotes()).rejects.toThrow(CLEAN_ERROR_FRAGMENT);
  });
});
