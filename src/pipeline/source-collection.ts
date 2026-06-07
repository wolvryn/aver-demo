import 'server-only';

import { getFinnhubApiKey } from '@/lib/config/env';
import { logger } from '@/lib/logger/logger';

/**
 * src/pipeline/source-collection.ts
 *
 * What: The single owning module for the source-collection API (the source seam) — a Finnhub
 *       adapter that fetches real-time stock quotes for the demo basket.
 * Does: Collects live quotes behind one interface, normalizing Finnhub's raw shape into a clean
 *       internal quote, with an ephemeral per-symbol TTL cache that protects the free-tier quota.
 * Use when: The pipeline needs source material. Call sites use this module, never the Finnhub
 *           HTTP API directly — all Finnhub access lives here (dependency isolation).
 *
 * Scope: collection only. This is NOT the ingestion contract; it produces raw source material
 *        the downstream pipeline grounds its (live) generation in. The cache covers collection
 *        only — generation stays live downstream.
 */

// ─── Types ───────────────────────────────────────────────────
/** A normalized, internal stock quote — the clean collection output for one symbol. */
export type StockQuote = {
  readonly symbol: string;
  readonly price: number;
  readonly change: number;
  readonly percentChange: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  /** ISO 8601 time the quote was current (derived from Finnhub's `t`). */
  readonly asOf: string;
};

/** The raw Finnhub `/quote` response, narrowed to numbers (NaN where a field is absent). */
type FinnhubQuote = {
  readonly c: number;
  readonly d: number;
  readonly dp: number;
  readonly h: number;
  readonly l: number;
  readonly o: number;
  readonly pc: number;
  readonly t: number;
};

/** One cached quote with the wall-clock time it was stored, for TTL evaluation. */
type CacheEntry = {
  readonly quote: StockQuote;
  readonly storedAt: number;
};

// ─── Constants ───────────────────────────────────────────────
const MODULE_NAME = 'source-collection';

/** Finnhub REST base. All Finnhub HTTP access is confined to this module (the source seam). */
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/** The fixed, curated demo basket. No user-supplied symbols ever reach Finnhub. */
export const DEMO_BASKET = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'] as const;

/** Cache lifetime: short enough to stay live, long enough to absorb a burst of visitors. */
const CACHE_TTL_MS = 60_000;

/** Finnhub timestamps are Unix seconds; convert to milliseconds for the Date constructor. */
const MILLISECONDS_PER_SECOND = 1000;

/** Ephemeral, in-memory, per-symbol cache. NOT a datastore — process-local and lost on restart. */
const quoteCache = new Map<string, CacheEntry>();

// ─── Helpers ─────────────────────────────────────────────────
/**
 * Reads a finite number from a raw JSON record, returning NaN when the field is missing or
 * not a number — so malformed responses surface as no-data rather than `undefined` leaks.
 *
 * @param raw - The parsed JSON object from Finnhub.
 * @param key - The field name to read.
 * @returns The finite number, or NaN when absent or non-numeric.
 * @throws {never}
 */
function readNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
}

/**
 * Narrows a raw Finnhub JSON response into the typed quote shape.
 *
 * @param raw - The parsed JSON object from Finnhub.
 * @returns The typed Finnhub quote (numeric fields, NaN where absent).
 * @throws {never}
 */
function parseFinnhubQuote(raw: Record<string, unknown>): FinnhubQuote {
  return {
    c: readNumber(raw, 'c'),
    d: readNumber(raw, 'd'),
    dp: readNumber(raw, 'dp'),
    h: readNumber(raw, 'h'),
    l: readNumber(raw, 'l'),
    o: readNumber(raw, 'o'),
    pc: readNumber(raw, 'pc'),
    t: readNumber(raw, 't'),
  };
}

/**
 * Reports whether a Finnhub quote carries no usable data. Finnhub returns a zeroed body
 * (notably `t=0`, `c=0`) for unknown symbols; such a response is not a valid quote.
 *
 * @param quote - The typed Finnhub quote.
 * @returns True when the quote should be treated as no-data.
 * @throws {never}
 */
function hasNoData(quote: FinnhubQuote): boolean {
  return quote.t <= 0 || quote.c <= 0 || Number.isNaN(quote.t) || Number.isNaN(quote.c);
}

/**
 * Normalizes a typed Finnhub quote into the clean internal collection output.
 *
 * @param symbol - The symbol the quote is for.
 * @param quote - The typed Finnhub quote (already validated as having data).
 * @returns The normalized stock quote.
 * @throws {never}
 */
function toStockQuote(symbol: string, quote: FinnhubQuote): StockQuote {
  return {
    symbol,
    price: quote.c,
    change: quote.d,
    percentChange: quote.dp,
    high: quote.h,
    low: quote.l,
    previousClose: quote.pc,
    asOf: new Date(quote.t * MILLISECONDS_PER_SECOND).toISOString(),
  };
}

/**
 * Returns a still-fresh cached quote for a symbol, or undefined when absent or expired.
 *
 * @param symbol - The symbol to look up.
 * @returns The cached quote if within TTL, else undefined.
 * @throws {never}
 */
function getFreshFromCache(symbol: string): StockQuote | undefined {
  const entry = quoteCache.get(symbol);
  if (entry === undefined) {
    return undefined;
  }
  const isFresh = Date.now() - entry.storedAt < CACHE_TTL_MS;
  return isFresh ? entry.quote : undefined;
}

/**
 * On a fetch failure, serves the last-good cached quote if one exists (even if expired),
 * otherwise throws a clean, plain-English error. Logs the underlying cause via the centralized
 * logger using the error message only — never the full error, never the key.
 *
 * @param symbol - The symbol whose fetch failed.
 * @param cause - The underlying error or thrown value.
 * @returns The last-good cached quote, when one is available.
 * @throws {Error} A clean, user-safe error when no cached fallback exists.
 */
function serveLastGoodOrThrow(symbol: string, cause: unknown): StockQuote {
  const message = cause instanceof Error ? cause.message : String(cause);
  const lastGood = quoteCache.get(symbol)?.quote;
  if (lastGood !== undefined) {
    logger.warn(MODULE_NAME, 'getQuote', 'serving last-good cached quote after fetch failure', {
      symbol,
      error: message,
    });
    return lastGood;
  }
  logger.error(MODULE_NAME, 'getQuote', 'no quote available and no cached fallback', {
    symbol,
    error: message,
  });
  throw new Error(`Unable to collect a quote for ${symbol}. Please try again shortly.`);
}

/**
 * Fetches and normalizes a single quote from Finnhub. Throws on a non-OK response or a no-data
 * body so the caller can apply the last-good-cache fallback. Error handling for these throws is
 * owned by `getQuote`, the single orchestrator of the fetch seam.
 *
 * @param symbol - The symbol to fetch.
 * @returns The normalized quote.
 * @throws {Error} On a non-OK HTTP status or a zeroed/no-data response.
 */
async function fetchFromFinnhub(symbol: string): Promise<StockQuote> {
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(getFinnhubApiKey())}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub responded with status ${response.status} for ${symbol}`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  const parsed = parseFinnhubQuote(raw);
  if (hasNoData(parsed)) {
    throw new Error(`Finnhub returned no usable data for ${symbol}`);
  }
  return toStockQuote(symbol, parsed);
}

/**
 * Resolves one symbol's quote: a fresh cache hit short-circuits the fetch; otherwise the live
 * quote is fetched and cached, and any failure falls back to the last-good cache or a clean error.
 *
 * @param symbol - The symbol to resolve.
 * @returns The normalized quote.
 * @throws {Error} When the fetch fails and no cached fallback exists.
 */
async function getQuote(symbol: string): Promise<StockQuote> {
  const cached = getFreshFromCache(symbol);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const quote = await fetchFromFinnhub(symbol);
    quoteCache.set(symbol, { quote, storedAt: Date.now() });
    return quote;
  } catch (error) {
    return serveLastGoodOrThrow(symbol, error);
  }
}

// ─── Seam ────────────────────────────────────────────────────
/**
 * Collects live, normalized quotes for the fixed demo basket. Each symbol is served from its
 * fresh cache when available, otherwise fetched live; a failed symbol falls back to last-good
 * cache or fails with a clean error.
 *
 * @returns The collected quotes, one per basket symbol, in basket order.
 * @throws {Error} When any symbol cannot be served from a live fetch or a cached fallback.
 */
export async function collectBasketQuotes(): Promise<readonly StockQuote[]> {
  try {
    return await Promise.all(DEMO_BASKET.map((symbol) => getQuote(symbol)));
  } catch (error) {
    logger.error(MODULE_NAME, 'collectBasketQuotes', 'failed to collect the demo basket', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
