---
name: wolvryn-forge
description: Core development identity and philosophy for all Wolvryn FORGE products. This is the foundation skill — it loads on every session for every Wolvryn project. Covers fix philosophy, separation of duties (Chat vs Code), living-documentation discipline and single source of truth, commit format, versioning, and required project structure. Triggers on any reference to a Wolvryn project, "let's build", "start a new session", "continue working on", or any FORGE product name.
---

# Wolvryn FORGE — Core Standards

The foundation for all Wolvryn Technology Systems products. These principles are stack-agnostic and travel with every project.

---

## Who This Is For

**Developer:** Rob Wisniewski (GitHub: contra19)
**Company:** Wolvryn Technology Systems
**Products:** Wolvryn FORGE micro-SaaS line (Butler, Kumite, Constellation, ZoneCheck, and future products)
**Style:** Direct, no encouragement needed. Rob undersells his accomplishments — push back when he does. He prefers honest assessments over validation.

---

## Fix Philosophy

Every fix must be the correct fix, not the fast fix. This is non-negotiable.

**The rule:** If a fix would need to be redone later to meet proper standards, it is not a fix — it is technical debt disguised as progress. Do not implement it. Implement the proper fix now, or document the proper design and defer the entire item.

**What "correct fix" means:**
- Uses contemporary coding standards and best practices for the stack
- Does not introduce patterns that will need to be unwound
- Follows the project's established architectural patterns
- Is tested at the same standard as the rest of the codebase
- Does not compound existing issues — if touching code adjacent to a known problem, fix the known problem first or alongside

**When the correct fix is too large:**
1. Document the correct design in the Claude Chat thread
2. Do NOT implement a "temporary" version that conflicts with the correct design
3. Add the item to the backlog with the documented design
4. Leave the code unchanged until the proper fix can be done

A missing feature is better than a wrong implementation. Wrong implementations get built on top of, and then the rework costs 3x.

**The compounding rule:** Technical debt compounds like interest. One shortcut invites another. Two shortcuts create a pattern. Three shortcuts become "how we do things." Fix it right the first time. Every time.

---

## Dependency Seams & Portability

Depend on external capabilities — hosting platforms, model providers, database
hosts, third-party APIs — through seams the codebase owns. One module or interface
per dependency, so any single one can be swapped with a blast radius of one module,
not a hunt across the app.

- **Commit fully behind the seam.** Use the chosen provider's premium, specific
  features completely *inside* its owning module. The goal is NOT lowest-common-
  denominator portability — that throws away the value you paid for. The goal is
  "committed, but replaceable."
- **Apply per dependency, by risk.** Weight the effort by how likely a swap is and
  how painful lock-in would be. High-churn or high-blast-radius dependencies (model
  provider, hosting platform, data layer) earn a seam. Foundational dependencies you
  will realistically never swap (language, core framework) do NOT — abstracting them
  is a tax that buys portability you'll never exercise and usually costs quality.
- **The operative test:** "If I had to swap this dependency, how many files change?"
  One module is the target. The whole codebase is a smell.

This is the structural form of the Fix Philosophy: isolating a dependency correctly
now is the proper fix; scattering provider calls across the app is debt that costs 3x
to unwind when the swap eventually comes.

---

## Separation of Duties — Claude Chat vs Claude Code

Rob uses two Claude surfaces and his own judgment for every project. Strictly separate responsibilities. Non-negotiable.

**Rob decides. Claude advises.** Architecture decisions are made collaboratively between Rob and Claude Chat. Claude Chat proposes, analyzes trade-offs, and drafts ADRs — but Rob makes the call. Claude Code executes what Rob approves.

**Claude Code handles code only:**
- Code changes, refactors, bug fixes
- Running tests, format checks, builds
- Sweeping for patterns (grep, audit)
- Committing and pushing

**Claude Chat handles everything else:**
- Architecture discussion and ADR drafting (collaborative with Rob)
- Claude Code prompts — ready to copy, specific, one concern per prompt
- Document content production (ADR files, ARCHITECTURE.md, changelogs, skill files)
- Commit message drafting — ready-to-copy inline `git commit -m` commands
- File content — delivered as downloadable .md files or code blocks ready to paste
- Audit triage and prioritization
- Session planning and sequencing

**Hard rules:**
- Claude Code prompts must NEVER include instructions to create, update, or replace documentation files.
- Claude Chat must NEVER assume it can run code or access the repo.
- All Claude Chat output intended for the repo must be in ready-to-copy format — either as a downloadable file or as a fenced code block that can be pasted directly. No "you could write something like..." — write the actual content.

**Commit message format:**
```
git commit -m "type: summary line with context (BQ-XXX)

- Bullet detail of what changed and why
- Another change

N/N tests passing, build clean"
```

**Conventional commits:** `feat:` `fix:` `chore:` `test:` `docs:` `refactor:` `security:` `ops:`

### Prompt Granularity Rule

Each Claude Code prompt targets ONE testable concern — one module,
one behavior change, one migration. The prompt is done when its
tests pass and the build is clean.

Combine concerns into a single prompt ONLY when they are
inseparable — e.g., a type change and the one consumer that
uses it, or a delete and the replacement that must exist in
the same commit. If two changes can be tested independently,
they are two prompts.

This is not optional. Batched prompts produce batched bugs.

---

## Living Documentation & Single Source of Truth

Documentation does not fail because it is missing. It fails because a fact lives in
two places, one goes stale, and you can no longer tell which to trust — so you re-read
the code to reconstruct what happened. That reconstruction is the cost this section
exists to eliminate. A feature slips through the cracks not in the decision and not in
the implementation, but in the un-synthesized space between them that nobody owns.

**The rule: every artifact has exactly one job and one source of truth. Never
duplicate what another artifact owns.** If a fact would belong in two artifacts, it
lives in the more authoritative one; the other *points* to it. A document you cannot
trust is worse than no document — it costs you time *and* misleads you.

### Artifact ownership

| Artifact | Owns | Mutability |
|----------|------|------------|
| **ADRs** (`docs/decisions/`) | *Why* a decision was made, at a point in time, and the alternatives weighed | Immutable. Superseded or amended by later ADRs — never edited to describe current state |
| **ARCHITECTURE.md** (`docs/`) | *How the system works now*, synthesized: current structure, module graph, data flow, and a data-model / data-dictionary section (every table and field's canonical meaning, who writes it, what reads it, and why it exists) | Mutable. Always reflects *now*. Edited in place |
| **CLAUDE.md** (repo root) | Architectural *rules and constraints* Claude Code must obey; module-boundary laws; coding standards | Mutable. Changes when a rule changes |
| **Session doc** | Sprint status and the next task | Transient working state |
| **CHANGELOG.md** | The release record (semver) | Append-only per release |
| **GitHub Issues** | The backlog | Living |

The three easiest to confuse are ADRs, CLAUDE.md, and ARCHITECTURE.md. Hold the line:

- **ADRs answer "why," never "what is now."** An ADR is a dated decision; when the
  decision changes you supersede it, you do not edit it to describe the present. ADRs
  are a decision log, not a system description.
- **CLAUDE.md answers "what rule must I follow."** "lib never calls lib" is a rule — an
  imperative, not a description.
- **ARCHITECTURE.md answers "how does it actually work right now."** "An action enters
  here → the engine loads state → resolves → writes → narrates" is a description. It
  points to the ADRs for *why* it is shaped this way and to CLAUDE.md for the *rules*;
  it never re-derives either.

When you move where something lives, or change how data flows, **ARCHITECTURE.md is the
file that changes** — and because it is the one canonical current-state document, the
change cannot slip through a crack, because there is exactly one crack and it is the
file you are editing.

### The data-model section is load-bearing

ARCHITECTURE.md's data-model section records, for every table and field: its canonical
meaning, who writes it, what reads it, and *why it exists*. That last point matters most
for fields that look removable but are not — a column that holds a single value today
because a future capability is not yet active, or an identifier whose form is a
deliberate seam. **Record why such a field exists, so a future session does not "clean
up" the exact seam that keeps a future cheap.** A field whose purpose is undocumented is
a field someone will eventually delete.

### Keeping it alive — update triggers, not good intentions

Documents rot when updating them is a separate act from the change that made them stale.
The fix is to make the update part of the change, enforced at the same gate as tests:

- If **where something lives or how data flows** changed → ARCHITECTURE.md is updated
  *before the commit*.
- If a **field or table changed meaning, ownership, or existence** → the data-model
  section is updated *before the commit*.

These are pre-commit gates with the same standing as "tests pass." Per the dual-Claude
separation, **Claude Code does not author these documents.** When Code makes a structural
or data change, it *flags* the needed ARCHITECTURE.md update — exactly as it flags
decisions for ADRs — Claude Chat authors the update, Rob places it, and the commit waits
on it.

### Proportionality

Match documentation weight to what exists. A young repo with no code has a near-empty
ARCHITECTURE.md, and that is correct — it fills in *as the system is built*, not ahead of
it. Writing a rich current-state document before the system exists is just a second guess
that goes stale against the real build. Stub the structure and the discipline early; grow
the content with the code. Over-documentation is its own failure mode: if updating the
docs is heavier than the change, the update gets skipped, and staleness returns by another
road.

---

## Session Protocol

### Session Start — in order
1. Read `CLAUDE.md` — architecture rules, module boundaries, coding standards
2. Read `ARCHITECTURE.md` — current structure, data flow, and data model (how the system works *now*)
3. Read current session document — sprint status and next task
4. Read the backlog — open items, note anything CRITICAL
5. Read specific ADRs relevant to today's work (from `docs/decisions/`)
6. Run the code audit skill
7. Fix any CRITICAL audit findings before writing new code

### During the Session
8. Write tests before implementation when possible
9. After every code change: run format check. Never report a task as complete without passing format, tests, and build.
10. When a non-blocking issue is found, add it to the backlog immediately with a BQ number
11. If a decision affects architecture, note it for Claude Chat to write as an ADR
12. If structure, flow, or a field's meaning/ownership/existence changed, note it for Claude Chat to update ARCHITECTURE.md (Code flags; Chat authors)
13. Keep prompts to Claude Code small and focused — one concern per prompt

### Session End — before committing
14. Review the backlog — resolve any items fixable quickly
15. Ensure ARCHITECTURE.md reflects any structural, flow, or data-model change made this session (flagged for Claude Chat to author before the commit)
16. Run the full pre-commit checklist
17. Commit with a conventional commit message

---

## Required Project Structure

| Element | Purpose | Location |
|---------|---------|----------|
| `CLAUDE.md` | Architecture rules, coding standards | Repo root (Claude Code reads automatically) |
| `ARCHITECTURE.md` | Current system structure, data flow, and data model/dictionary (the single current-state document) | `docs/` |
| ADR files | Individual architecture decisions | `docs/decisions/ADR-NNN.md` with INDEX.md |
| Backlog | GitHub Issues — labeled by severity, milestoned by version | GitHub |
| `CHANGELOG.md` | Canonical release record (semver) | Repo root |
| `README.md` | Project overview, stack, status | Repo root |
| `.env.example` | All env vars with placeholders | Repo root (if project has secrets) |
| Skills | Project-specific Claude Code context | `.claude/skills/` |

---

## Project Initialization

Every Wolvryn project begins the same way, before any application code:

1. **Git repository first.** Initialize the repo and push to GitHub as step
   zero. No code, doc, or ADR exists outside version control.
2. **`.gitignore` before secrets.** Commit a `.gitignore` covering env files,
   build output, dependencies, and local tooling before any secret-bearing
   file could be created.
3. **Backlog lives in GitHub Issues.** Issues are the canonical backlog —
   not a markdown file in the repo. Use labels for severity (CRITICAL / HIGH /
   MEDIUM / LOW) and the version milestone for sequencing. BQ-style references
   in commits point at issue numbers.
4. **ADRs are independent files, indexed by a registry.** Each decision is its
   own `docs/decisions/ADR-NNN.md`. `docs/decisions/INDEX.md` is the registry —
   one row per ADR (number, title, status, date). Claude Chat writes the full
   ADR file plus the single index row; nothing else edits the index.
5. **No DESIGN.md.** Structural decisions are ADRs. There is no separate design
   document.
6. **Stub ARCHITECTURE.md.** Create it at init in `docs/`, near-empty is correct. It is
   the single current-state document — how the system works now, its data flow, and its
   data model/dictionary. It grows with the code; it is never written ahead of it.

---

## Versioning

Semantic versioning. Git tags mark each release. CHANGELOG.md is the canonical record.

- **Patch (vX.X.n):** Bug fixes, code quality, security, refactors. No user-facing changes.
- **Minor (vX.n.0):** New user-visible features.
- **Major (vn.0.0):** Breaking changes or platform shifts.

Work organized by target version, not by day or session number.

---

## Pre-Commit Checklist

- [ ] Audit run — all CRITICAL issues resolved
- [ ] Format check passes
- [ ] All tests passing
- [ ] Build passes
- [ ] Session doc updated
- [ ] New ADRs written if decisions were made
- [ ] ARCHITECTURE.md updated if structure or data flow changed
- [ ] Data-model section updated if a field or table changed meaning, ownership, or existence
- [ ] README updated if stack or status changed
- [ ] Backlog reviewed — no blocking items unresolved
- [ ] Commit message follows conventional commits

---

## What These Standards Are NOT

- **Not stack-specific.** The stack changes per project. These principles don't.
- **Not a substitute for CLAUDE.md.** Each project's CLAUDE.md documents project-specific architecture.
- **Not optional.** Security principles especially are non-negotiable.