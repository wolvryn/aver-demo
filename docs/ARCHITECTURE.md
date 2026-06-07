# ARCHITECTURE — aver-demo

The single current-state description of how `aver-demo` works *now*. It points to `docs/decisions/` for *why* and to `CLAUDE.md` for *rules*; it never re-derives either. It grows with the code.

**Status:** slice one in progress. Built: the centralized logger, typed config, the Finnhub source seam, and the ingestion-contract types. The summarize step, run orchestration, the Aver client, and the dual-pane UI are still stubs awaiting their slices.

## Overview

`aver-demo` is the public demonstration of Aver. A live agent pipeline runs in two lanes — a clean lane and a fault-injected lane — and a dual-pane UI shows Aver's verdicts beside the pipeline's output. Aver itself is not in this repo; it is a separate private service invoked server-side over HTTP. See `docs/decisions/ADR-001.md` and `ADR-002.md`.

## Module graph

**Built**

- `src/lib/logger/` — the centralized logger, and the only module permitted to call `console` (enforced by a no-console ESLint rule). Server-side. Methods `error/warn/info/debug` with signature `(module, operation, description, context?)`, one structured JSON line per call, level-gated by `LOG_LEVEL` (default `info`), with enforced redaction of secret-like context keys and `Error` reduced to `.message` (stacks at debug only).
- `src/lib/config/` — typed, server-only environment access (`env.ts`). Required secrets fail loudly; config/public values use separate accessors. Current accessors include the Finnhub key (SECRET) and `LOG_LEVEL` (CONFIG). Client-safe public values (e.g. the Sentry DSN) are read through a separate public accessor so no server secret crosses to the browser.
- `src/pipeline/source-collection.ts` — the **source seam**. `collectBasketQuotes` fetches live quotes for `DEMO_BASKET` (AAPL, MSFT, NVDA, AMZN, GOOGL) from Finnhub and normalizes them to `StockQuote`, behind an ephemeral 60s per-symbol in-memory cache. All Finnhub HTTP is isolated to this module. A 429 or fetch failure serves the last-good cached value or throws a clean plain-English error; zeroed/`t=0` responses are treated as no-data, never returned as a quote.
- `src/contract/` — the ingestion-record types (`ingestion-record.ts`), the public-safe contract the Aver service consumes.

**Stub / planned**

- `src/pipeline/model-api.ts` — the model-API seam (summarize step).
- `src/pipeline/pipeline.ts` — run orchestration tying collection → summarize → record emission across the two lanes.
- `src/lib/aver-client/` — the sole server-side client to the external Aver service (the service does not exist yet).
- `src/components/dual-pane.tsx` — the dual-pane UI; the only orchestrator of pipeline + Aver client.
- `src/app/` — minimal App Router landing route.

## Boundaries (build-enforced)

- **Pipeline must not import Aver.** Nothing under `src/pipeline/**` may import the Aver client or an aver package (no-restricted-imports lint). CLAUDE.md invariant 1, ADR-002.
- **All logging goes through the logger.** The logger is the only permitted `console` caller (no-console lint).
- **Logging is server-side; client errors go to Sentry.** The logger is server-only and must not be imported into client components; browser-side errors are captured by Sentry's client init.

## Data flow

**Current:** `collectBasketQuotes` returns `StockQuote[]` from the source seam (live, cached).

**Planned, as slices land:** the pipeline runs two lanes (clean / fault-injected) → the summarize step turns quotes into a markets summary via the model-API seam → a per-output ingestion record (`output` + `sources[]` + enrichment) is assembled → the dual-pane UI sends it through the Aver client to the external Aver service and renders the returned verdicts beside the output → the demo scores those verdicts against its held-back answer key.

## Data model / data dictionary

No datastore — the demo is ephemeral / in-memory (CLAUDE.md → Persistence). Two in-memory shapes:

- **`StockQuote`** (`src/pipeline/source-collection.ts`) — collection output: `symbol`, `price`, `change`, `percentChange`, `high`, `low`, `previousClose`, `asOf` (ISO). Internal to collection; deliberately separate from the contract.
- **Ingestion record** (`src/contract/`) — the contract sent to Aver: `output`, `sources[]` (always an array), and enrichment `timestamps` (source as-of + output produced-at), `entityRefs`, `runId`. Each field's purpose and the fault check it enables are recorded in `ADR-001`.