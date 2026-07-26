# jura-contracts

The single source of truth for cross-repo concepts in Jura AI — good-law status, citation
identity, authority/judgment identity — consumed by `jura-app`, `jura-data`, and `jura-review`.

Created 2026-07-27, Phase 3 of the engineering foundation plan, to fix a real problem: "good law
status" (and related concepts) were independently typed 3 different, non-identical ways across
the three product repos, hand-kept in sync with no real source of truth.

## How it works

1. **`schemas/*.schema.json`** — JSON Schema definitions. The language-neutral interchange format
   (chosen over a TS-only Zod/`.d.ts` source specifically because Python can't consume that, but
   both TS and Python have mature JSON Schema codegen).
2. **`codegen/`** — generates the base types: `json-schema-to-zod` for TypeScript (Zod schemas),
   `datamodel-code-generator` for Python (Pydantic models). Run via `npm run codegen`.
3. **`generated/{typescript,python}/`** — the generated base types. **Never hand-edit these** —
   they're regenerated from `schemas/` on every codegen run.
4. **`validators/{typescript,python}/`** — hand-maintained semantic wrappers around the generated
   base types, for invariants JSON Schema can't express (e.g. cross-field business rules). This is
   where the good-law `CitatorFinding → GoodLawStatus` mapping function lives.
5. **`fixtures/`** — golden cross-language fixtures: one JSON instance validates against both the
   generated TS and Python outputs, proving the two runtimes agree.

## Consuming this package

- **TypeScript** (jura-app, jura-review): `npm install @juraai/contracts` (private registry /
  git dependency — see `CONTRIBUTING.md` for the publishing policy).
- **Python** (jura-app/services/ai, jura-data): `uv add juraai-contracts` (private index / git
  dependency — see `CONTRIBUTING.md`).

See `CHARTER.md` for the cross-repo engineering charter this package is the canonical home of,
and `CONTRIBUTING.md` for the schema-change review and versioning process.
