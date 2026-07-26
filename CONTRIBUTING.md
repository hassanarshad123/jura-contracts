# Contributing to jura-contracts

## Schema-change review process

A change to any `schemas/*.schema.json` file requires:

1. **State what changed and why** in the PR/commit description — which concept, which field,
   whether it's additive (new optional field, new enum value) or breaking (field removed, enum
   value dropped, a type narrowed).
2. **Regenerate before committing**: `npm run codegen` (TypeScript) — the Python side regenerates
   via the same script (see `codegen/generate.mjs`). Never hand-edit anything under `generated/`.
3. **Update or add a fixture** in `fixtures/` covering the changed concept, and confirm the
   round-trip test passes (`npm test` / `pytest`).
4. **A breaking change requires a version bump** (see below) before it merges — not after.
5. **Legal-accuracy changes** (e.g. anything touching the `CitatorFinding`/`GoodLawStatus`
   mapping) get the same engineering-judgment-grounded-in-evidence treatment as the rest of this
   plan — no separate formal legal sign-off gate, but the reasoning must be written down in the
   schema's own doc comments, not just the commit message.

## Versioning policy

- **Semver.** A new optional field or a new enum value (that consumers don't have to handle
  immediately) is a **minor** bump. Removing a field, renaming a field, removing an enum value, or
  narrowing a type is a **major** bump. A generator/tooling-only change with no schema change is a
  **patch** bump.
- **No silent breaking changes.** If a change is breaking, it is a major version, full stop — do
  not ship a breaking change as a minor to avoid the version-bump conversation.

## Publish targets

- **TypeScript**: published as `@juraai/contracts` to a private npm-compatible registry (GitHub
  Packages, scoped to `hassanarshad123`) — or, until that's set up, consumed as a git dependency
  (`"@juraai/contracts": "github:hassanarshad123/jura-contracts#v0.1.0"`) pinned to a tag, never
  to `main` directly.
- **Python**: published as `juraai-contracts` the same way — a private index, or in the interim a
  git dependency pinned to a tag (`uv add "juraai-contracts @ git+https://github.com/hassanarshad123/jura-contracts@v0.1.0"`).

## Compatibility / migration windows

When a breaking (major) version ships:

1. The new major is published, but **no consuming repo is force-upgraded automatically.**
2. Each consumer repo's own CI must pass against the new version **before** that repo's
   `package.json`/`pyproject.toml` pin is bumped to it — verified in that repo's own PR, not
   assumed from this repo's tests alone.
3. The old major stays consumable (git tag never deleted) until every consumer has migrated, so a
   partial rollout is never a broken state for the repos that haven't moved yet.

## What belongs here vs. what stays local

A concept belongs in `jura-contracts` when it needs to mean the same thing to a lawyer reading
`jura-app` AND a reviewer working in `jura-review` AND the pipeline in `jura-data` (or some subset
spanning 2+ repos) — e.g. good-law status, citation identity, authority/judgment identity.

A concept stays local to its own repo when it's internal workflow machinery — e.g. jura-review's
`ReviewStatus`/`PublicationStatus` (reviewer-workflow states, not a legal concept a lawyer reads
in jura-app), or jura-app's SSE wire envelope / chat-turn reducer state (the web↔AI seam is
internal to that one repo).
