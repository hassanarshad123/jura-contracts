# Jura AI — Cross-Repo Engineering Charter

Drafted 2026-07-27 (Phase 1.3), moved to its final home here 2026-07-27 (Phase 3.1) once
`jura-contracts` existed. This is now the canonical copy — the pointer files in the other three
repos (`ENGINEERING_CHARTER.md`) link here, not to the old `_reference/` draft location.

No engineering charter or cross-repo contract document existed anywhere in this product before this
— `jura-app`'s 30+ doc files never mentioned `jura-data` or `jura-review`, and only `jura-data`'s
README had a one-sided "contracts with the other repos" table.

---

## 1. Repo ownership map

| Repo | Owns | Consumes from others |
|---|---|---|
| `jura-data` | Corpus acquisition, cleaning, enrichment, verification. `jura.judgment`, `jura_pk.*`, `Hassan_cleaning_pk`, `jura_pk_gold`, the good-law citator, `scripts/create_review_schema.py` (the `jura_review` DDL, checksum-guarded against jura-review's replica). | Nothing from the other two — this is the source of the corpus. |
| `jura-review` | The `jura_review` schema (lawyer verification workflow: queue, consensus, reputation, corrections). Its own DDL is a checksum-verified replica of jura-data's. | Reads jura-data's corpus (`DSN_PK`, `DSN_UK`, `DSN_IN` — read-only) and control-plane schema (`JURA_INGEST_DSN` — read+write, owned here). |
| `jura-app` | The customer SaaS: `apps/web` (system-of-record), `apps/landing`, `services/ai` (AI engine). Its own tenant/auth/billing data. | Reads jura-data's gold corpus via its own synced Postgres + OpenSearch copy (Phase 5) — never a live connection to jura-data's own database. |
| `jura-contracts` | The shared schema definitions for concepts that cross repo boundaries (good-law status, citation, authority/judgment identity) — the single source of truth all three repos codegen from. | Nothing — it's the dependency, not a consumer. |

## 2. Shared-contracts usage rule

Any concept that legitimately means the same thing across 2+ repos (a legal status, a citation
format, an identity key) is defined ONCE in `jura-contracts` and consumed via the generated
TS/Python packages — never independently re-typed in a consuming repo. A repo-local workflow
concept (e.g. jura-review's `ReviewStatus`/`PublicationStatus`) stays local; the test is "does this
concept need to mean the same thing to a lawyer reading `jura-app` and to a reviewer working in
`jura-review`" — if yes, it belongs in `jura-contracts`.

## 3. CI-parity bar

Every repo's CI must have, at minimum: a secret scan (gitleaks or equivalent — universal today), a
lint gate that actually blocks (not just a build step that ignores lint failures), a type-check
gate, and a test suite that actually runs in CI (not just exists locally). A repo's CI is not
"caught up" until all four are true and enforced, not merely present.

## 4. Secrets policy

- Nothing in any repo holds a credential VALUE — only key names. The central store
  `C:\Users\hassa\.secrets` is the source of truth; each repo's `.env`/`.env.local` is populated
  from it and is gitignored everywhere.
- **Standing decision (2026-07):** rotation of credentials exposed in archived-repo git history
  (and the smaller, hostname-only exposure found in `jura-data`'s current history, Phase 0.4) is
  explicitly declined — private-project decision. Do not re-raise this without new information;
  document any new exposure found, but do not act on it without the owner's explicit sign-off.
- A repo's own git history is not automatically safe just because its `.env` is gitignored today —
  Phase 0.4's scan (and the earlier archived-repo discovery) both found real exposure sitting in
  history, not the working tree. Treat "gitignored now" and "never was exposed" as different
  claims.

## 5a. Version-pinning parity (checked 2026-07-27)

- **Node:** `jura-app` and `jura-review` both pin `.nvmrc` = `24`; CI on both reads the file
  (`node-version-file: .nvmrc`) rather than hardcoding a value that can drift from it.
- **Python:** `jura-data` (`requires-python = ">=3.12"`) and `jura-app/services/ai`
  (`requires-python = ">=3.12,<3.13"`) are compatible, not identical — intentional, not drift.
  `services/ai` pins a tighter upper bound because it's a deployed production service where an
  unplanned interpreter bump is a real deploy risk; `jura-data` is a data harness with broader
  compatibility needs across its scraper trees. Both resolve to Python 3.12.x today.
- **Secret scanning:** gitleaks runs in all three repos' CI — the one gate that was already
  universal before this plan.

## 5. Escalation path for cross-repo breaking changes

A change to a `jura-contracts` schema that would break an existing consumer (a field removed, an
enum value dropped, a type narrowed) requires: (a) a version bump per `jura-contracts`'
`CONTRIBUTING.md` policy, (b) the change proposal reviewed before merge (not after), (c) each
consuming repo's own CI passing against the new version before that repo's `package.json`/
`pyproject.toml` pin is updated — never force a breaking bump onto a consumer without its CI
having proven compatibility first.

---

*Jura AI — Cross-Repo Engineering Charter · internal.*
