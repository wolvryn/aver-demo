# aver-demo

The public demonstration of **Aver** — Wolvryn's agent output integrity assessment. A live agent pipeline produces faulty outputs on demand and shows Aver catching them, side by side.

This is the hero proof on the Wolvryn site. It contains the demo pipeline and UI only; Aver's detection logic lives in a separate private service and is invoked over HTTP.

## Stack

TypeScript · Next.js (App Router) · React · Vitest · deployed on the Wolvryn default host.

## Status

Scaffolding. See `docs/ARCHITECTURE.md` for current state and `docs/decisions/` for decisions.

## Structure

- `src/pipeline/` — the Aver-unaware two-lane pipeline
- `src/contract/` — the ingestion-record types (public-safe)
- `src/lib/aver-client/` — the server-side client to the Aver service
- `src/components/` — the dual-pane UI
- `docs/` — `ARCHITECTURE.md` (current state) and `decisions/` (ADRs)
- `CLAUDE.md` — repository rules

## Development

```
npm install
npm run dev      # local dev server
npm run build    # production build
npm run test     # vitest
npm run lint     # eslint (includes the pipeline→Aver import-boundary rule)
```

Copy `.env.example` to `.env.local` and fill in values before running. No secrets are committed.

## Boundaries

This is a **public** repository. It contains no proprietary detection logic and no source lifted from private repos. See `CLAUDE.md` → "Public repository — IP boundary" and `docs/decisions/ADR-002.md`.