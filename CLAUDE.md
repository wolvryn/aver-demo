# CLAUDE.md — aver-demo

Project rules and invariants for this repository. Read before writing code.

**Authority model.** ADRs in `docs/decisions/` own the immutable *why*. `docs/ARCHITECTURE.md` owns the current *how*. This file owns **project-specific rules** — the conventions the shared skills explicitly defer to each project (module boundaries, import rules), plus the invariants from the ADRs. Universal standards are **not** restated here; they live in `.claude/skills/` (`wolvryn-forge` core, `-code-standards`, `-security`, `-testing`, `-deploy`) and are authoritative. Load and follow them.

## What this repo is

`aver-demo` is the **public** demonstration of Aver, Wolvryn's agent output integrity assessment, and the hero proof on the Wolvryn site: a live agent pipeline that produces faulty outputs on demand and shows Aver catching them. Full design and rationale: `docs/decisions/ADR-001-demo-design.md` and `docs/decisions/ADR-002-exposure-boundary.md` (authoritative).

This repo contains the **pipeline** (two lanes), the **dual-pane UI**, and a thin **server-side client** that calls the Aver service. It does **not** contain Aver's detection logic — Aver lives in the private `aver` repo, is deployed as a separate service, and is invoked over HTTP.

## Public repository — IP boundary (hard rules)

This is a **public** repository. Per ADR-002, it must never contain anything proprietary:

- **No Aver detection logic.** Aver is reached only as an external service via the server-side client. Never import Aver source into this repo.
- **No lifted private-repo source.** Butler and other private repos may inform *patterns*, but no Butler/private source, internal infra references, or Wolvryn-internal process details are copied in. The demo pipeline is built clean and generic.
- **No secrets in the repo or the client bundle.** The Aver endpoint and any credentials are server-side only; never call Aver from the browser.
- **Public-safe surfaces only:** the ingestion contract types, the pipeline, the dual-pane UI, and the server-side Aver client. The *contract* is public (it is the customer-facing "minimum Aver needs"); the *detection* is secret and never appears here.
- **The answer key is demo-side only** and is never sent to the Aver service.

## Separation of duties

- **Claude Chat** owns architecture, ADRs, all documentation (this file, `ARCHITECTURE.md`), and Claude Code prompt drafting. **Rob decides; Chat advises.**
- **Claude Code** owns implementation only. Code prompts never include instructions to create or edit documentation.
- If implementation reveals a documented decision is wrong, stop and flag it for an ADR/architecture update — never silently diverge.

## Non-negotiable invariants (from ADR-001)

1. **The pipeline is Aver-unaware.** It is foreign code Aver observes from the outside, mirroring a real engagement. (Made concrete as an import rule below.)
2. **Black-box boundary.** Aver reads only the pipeline's observable output surface — the emitted record, nothing else.
3. **The dual-pane UI is the only orchestrator.** It alone drives both pipeline and Aver and renders the split view.
4. **Live, fault-injected at the source.** Generation runs live; faults are injected into source/input data and the live agent genuinely produces the faulty output. Never script a fake output.
5. **Injection is controllable** (`single` / `all` / `random`), and the buyer-facing run must always land.
6. **Answer-key discipline.** The demo knows ground truth; it is used only to score Aver, never passed to Aver. Aver detects blind.
7. **Three-state reporting.** Every check resolves to `clean`, `fault-found`, or `cannot-assess (missing signal X)` — never a silent skip.

## Project module & import boundaries

(The section the code-standards skill defers to CLAUDE.md.)

- The **pipeline** module must not import from, reference, or depend on Aver in any form. Enforce with a lint/import boundary. (Invariant 1.)
- Aver is reached **only** through one server-side **Aver client module** that owns the HTTP dependency (the dependency seam). No other module talks to the Aver service.
- The **dual-pane UI** is the only module permitted to drive both the pipeline and the Aver client and render the split view.
- Per the code-standards dependency-isolation rule: the **model API** lives behind one owning module, and the **source-collection API** lives behind one owning module. Call sites use those modules, never the SDKs directly.

## The ingestion record (canonical contract)

The pipeline emits, per output, a normalized record that is the canonical example of the minimum Aver needs, and is sent to the Aver service. Do not change its shape without an ADR.

- **Core:** `output`, `sources[]` (always a set, never a single value).
- **Enrichment (each enables exactly one fault check):** `timestamps` (source as-of + output produced-at), `entityRefs`, `runId`.

The schema grows only when a new fault class requires a new field.

## Secrets in this repo

Live generation and source collection require secrets — at minimum `ANTHROPIC_API_KEY`, plus any source-API credentials and the Aver service endpoint/credentials. Handle per the security skill: in `.env.local` (never committed), documented in `.env.example` with SECRET / CONFIG / PUBLIC classification, accessed through a typed config module (no scattered `process.env.X`), server-only. No `NEXT_PUBLIC_*` var ever carries a server secret or the Aver endpoint.

## Rate limiting & abuse (public surface)

This is a public page making expensive live model calls and outbound Aver calls. Per ADR-001 invariant 5 and the security skill: enforce run caps / rate limiting **server-side** (UI limits are not security boundaries). Untrusted input interpolated into prompts must be delimited and instruction-isolated.

## Testing

Test runner: **Vitest**. Tests mirror source path under `src/__tests__/` (`src/lib/foo.ts` → `src/__tests__/lib/foo.test.ts`). Every lib and service module has tests before it is considered done. Follow the testing skill for coverage, mocks-at-the-boundary, and null/edge-case rules. Mock the Aver service at the boundary.

## Persistence

**Default: none — the demo is ephemeral / in-memory.** Adding any datastore (cached runs, score history) requires an ADR documenting the datastore choice and its access-control approach, per the security skill.

## Documentation discipline

- ADRs are immutable; amend or supersede with a new ADR — never edit to describe current state.
- `ARCHITECTURE.md` is the single current-state doc — update it **in the same change** that alters structure, data flow, or a field's meaning. It starts as a near-empty stub and grows with the code.
- No `DESIGN.md` / `DECISIONS.md` / `BACKLOG.md` monoliths. Backlog lives in GitHub Issues.
- Single source of truth — do not duplicate a fact that already lives in an ADR or `ARCHITECTURE.md`.

## Build order

Per ADR-001: pipeline/demo first (Aver-unaware), then Aver. Within v1's all-four-fault scope, build in vertical slices — **ungrounded fabrication first** (proves the attach seam end-to-end), then cross-source contradiction, stale-data roll-forward, entity attribute-bleed, one at a time. Injected faults are legible, not adversarially subtle.

## Commits

Follow the conventional-commit format defined in the `wolvryn-forge` core skill (`feat: fix: chore: test: docs: refactor: security: ops:`), referencing the GitHub issue (BQ-style) where relevant.