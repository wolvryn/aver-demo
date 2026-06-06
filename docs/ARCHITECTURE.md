# ARCHITECTURE — aver-demo

The single current-state description of how `aver-demo` works *now*. It points to `docs/decisions/` for *why* and to `CLAUDE.md` for *rules*; it never re-derives either. It grows with the code — sections below are intentionally thin until the corresponding code exists.

**Status:** scaffolding (no feature code yet).

## Overview

`aver-demo` is the public demonstration of Aver. A live agent pipeline runs in two lanes — a clean lane and a fault-injected lane — and a dual-pane UI shows Aver's verdicts beside the pipeline's output. Aver itself is not in this repo; it is a separate private service invoked over HTTP. See `docs/decisions/ADR-001.md` and `ADR-002.md`.

## Module graph

*To be filled in as modules land.* Intended top-level seams:

- `src/pipeline/` — the Aver-unaware two-lane pipeline; owns its model-API and source-collection seams.
- `src/contract/` — the ingestion-record types (public-safe contract).
- `src/lib/aver-client/` — the only module that calls the Aver service.
- `src/components/` — the dual-pane UI; the sole orchestrator of pipeline + Aver client.
- `src/app/` — App Router entry.

## Data flow

*To be filled in.* Intended: pipeline produces output + sources → emitted as the ingestion record → (dual-pane UI) sent via the Aver client to the Aver service → verdicts returned → rendered beside the output; the demo scores verdicts against its held-back answer key.

## Data model / data dictionary

No datastore — the demo is ephemeral / in-memory (CLAUDE.md → Persistence). The one structured shape is the in-memory **ingestion record** defined in `src/contract/`: `output`, `sources[]`, and enrichment `timestamps`, `entityRefs`, `runId`. Each field's purpose and the fault check it enables are recorded in `ADR-001`. This section becomes load-bearing only if persistence is ever added (which would require its own ADR).
