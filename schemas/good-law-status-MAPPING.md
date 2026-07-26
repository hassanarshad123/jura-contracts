# Good-law-status vocabulary inventory & mapping (Phase 3.2)

Written 2026-07-27. This is the checkpoint-3.2.1-required side-by-side inventory of every
existing "good law" vocabulary in the product, plus the reasoning behind the reconciliation.

## The inventory

| Source | Field | Values | Role |
|---|---|---|---|
| **jura-data** (`enrichment/pk_finalize/goodlaw.py::aggregate()`, the REAL production citator, read in full 2026-07-27) | the computed `status` string | `reversed`, `superseded`, `overruled`, `questioned`, `caution`, `no_negative_found`, `insufficient_data` (**7 values** — confirmed by reading the actual rollup logic, not just its own comment) | Ground truth. This is what the citator ACTUALLY computes. |
| **jura-data** (`src/jura_api/models/dto.py::GoodLaw.status`) | a comment on an untyped `str \| None` field | `no_negative_found`, `caution`, `questioned`, `overruled`, `insufficient_data` (**5 values** — this comment is itself STALE; it's missing `reversed` and `superseded`, which the real rollup code in `goodlaw.py` does emit) | Documentation only — not an enforced enum, and out of date relative to the code that produces the values. A second, independent data point that hand-kept vocabulary comments drift. |
| **jura-app** (`packages/schema/src/chat.ts::GOOD_LAW_STATUS`, mirrored in `services/ai/.../corpus/models.py::GoodLawStatus`) | a real `z.enum(...)` / Python `StrEnum` | `good`, `doubted`, `overruled`, `superseded`, `untracked` (**5 values**) | The DISPLAY layer shown to a lawyer — backed only by the in-memory `CorpusRepository` today (Phase 5 builds the real one). |
| **jura-review** (`lib/types.ts::GoodLaw.status`) | a hand-copied, untyped `string \| null` | No enforced values — the file comment says it "mirrors `src/jura_api/models/dto.py` in shape" (i.e. it copies the STALE 5-value comment, one level further removed from the real 7-value ground truth) | A copy of a copy. Confirms the drift compounds the further it gets from the source. |
| **jura-review** (`lib/types.ts::ReviewStatus`, `PublicationStatus`) | real TS union types | `ReviewStatus`: `unreviewed`, `lawyer_verified`, `lawyer_rejected`. `PublicationStatus`: `lawyer_verified`, `machine_qualified`, `needs_work` | **Not a good-law concept** — this is jura-review's own reviewer-workflow state (has this judgment been checked by a lawyer, is it fit to publish). Stays local per the standing decision (`jura-contracts/CONTRIBUTING.md`) — a lawyer reading jura-app never sees this. |

Only the string `"overruled"` is common to every good-law vocabulary above. Everything else
differs in either the value set, the enforcement (real enum vs. comment vs. untyped copy), or
both.

## Why this isn't just a rename

Collapsing `no_negative_found` into a displayed `good`, for instance, changes what's being
asserted to a lawyer: `no_negative_found` is an **evidentiary absence-of-evidence claim** ("we
looked and found no negative treatment, with enough citation coverage to say so honestly") — not
the same speech act as an affirmative "this case IS good law." The reconciliation therefore uses
a **two-layer model**:

1. **`CitatorFinding`** (`schemas/citator-finding.schema.json`) — the canonical evidentiary enum,
   matching jura-data's REAL 7-value production vocabulary exactly (not the stale 5-value
   comment).
2. **`GoodLawStatus`** (`schemas/good-law-status.schema.json`) — the derived display enum,
   unchanged from jura-app's existing 5 values (they were already a reasonable lawyer-facing
   taxonomy).
3. **The mapping** (`validators/typescript/src/good-law-mapping.ts` +
   `validators/python/juraai_contracts_validators/good_law_mapping.py`) — an explicit, documented,
   tested function from (1) to (2), kept in exactly ONE place per language rather than
   reimplemented ad hoc wherever a good-law badge is rendered.

## The mapping (see the validator source for full per-case reasoning)

| `CitatorFinding` | → | `GoodLawStatus` | Why |
|---|---|---|---|
| `reversed` | → | `overruled` | Deterministic appeal reversal — same practical meaning as a citation-network overruling. |
| `overruled` | → | `overruled` | Direct. |
| `superseded` | → | `superseded` | Direct — structural invalidation, not a citation-network finding, but the same name and meaning. |
| `questioned` | → | `doubted` | Authority in doubt, not displaced. |
| `caution` | → | `doubted` | Conflicting/coordinate-bench treatment, or distinguished — also "in doubt, not displaced." **Two evidentiary findings intentionally collapse to one display value** — both already mean "read this case's continuing authority carefully" to a lawyer. |
| `no_negative_found` | → | `good` | Clean evidentiary finding, coverage-gated by the citator itself before it's even emitted. |
| `insufficient_data` | → | `untracked` | **The one real semantic gap** (documented in the validator, not silently papered over): jura-app's `untracked` originally meant "PK good-law graph doesn't cover this jurisdiction at all" (a coverage-*existence* gap); `insufficient_data` means "this IS a tracked PK case, the citation graph is just too thin to assess" (a coverage-*density* gap). Different claims. Same practical effect for a lawyer — an honest "we can't tell you" rather than a fabricated verdict — so they share the display value for now. |

## Open item

Per checkpoint 3.2.5: this mapping needs a human spot-check (Hassan or a delegate reviewing the
mapping table plus a sample of real judgments run through it) before Phase 5.5.5's production
flip. Not done as of this writing (2026-07-27) — this document and the validator code are ready
for that review, not a substitute for it.
