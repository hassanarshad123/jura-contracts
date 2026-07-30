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

## 6. Recurring governance cadence (Phase 9.3.1, added 2026-07-28)

This charter, and the fundamentals it documents, are not a one-time fix — without a standing
cadence, the product drifts back to the "no consistent standards, no shared source of truth"
state the engineering foundation plan was written to correct. **Quarterly** (next due
2026-10-28), re-run a scoped version of that original audit against all four repos:

- Re-check the CI-parity bar (§3) still holds on all four repos, not just at the moment each was
  fixed.
- Re-scan for new cross-repo type duplication (the same failure mode Phase 3 fixed for good-law
  status/citation/authority-identity — a new concept can drift the same way if nobody's watching).
- Re-check the mypy/lint backlog ratchets (jura-data's `mypy-baseline.txt`, jura-contracts' own
  `CONTRIBUTING.md` review process) haven't silently grown instead of shrinking.
- Re-confirm the `jura_review` DDL checksum-guard against jura-data (kept indefinitely per the
  original plan's decisions table — a different concern from Phase 3's vocabulary work, not
  superseded by it) is still green.
- Re-verify the OpenSearch tenant no-leak test (§9.3.4 of the original plan) is still a standing,
  non-optional CI check, not one that quietly got skipped or removed.

No separate tooling required — this is a checklist for whoever picks this up next (human or
agent), not a new automated system. Record the outcome as a dated entry in this file or in
`_reference\ENGINEERING_CHARTER.md`'s history if a full re-audit finds real drift worth logging.

---

*Jura AI — Cross-Repo Engineering Charter · internal.*

---

## 7. Credential-handling rules (added 2026-07-30, Phase 9 — learned the hard way)

Four incidents during the Phase 5/7/9 production work all traced to the same root cause: a secret
being passed through a layer that reinterprets its characters. These are now rules, not preferences.

1. **Never `set -x` in a script that touches a secret.** A traced script printed the RDS master
   password into SSM command output. Shell tracing expands and echoes every argument, including
   fetched secret values. Use `set -euo pipefail` without `-x`; if tracing is genuinely needed,
   `set +x` around the secret-handling block.
2. **Never interpolate a secret into a shell variable, a `source`d file, or a Python string
   literal.** Two separate scripts broke this way (`syntax error near unexpected token`, and a
   `JSONDecodeError` at the interpolation boundary) because passwords contain `$`, `(`, `=`, `&`.
   Write the secret to a file and have the consumer read the file, or do the whole operation in one
   Python process that never lets the value touch a shell.
3. **A password embedded in a URL/DSN must be `urlencode()`d, and preferably alphanumeric.** A `%`
   in the RDS master password produced a DSN that every compliant parser rejects, breaking
   `migrate.yml`. `random_password` blocks that feed a connection string use `special = false`
   (`redis_auth`, `jura_ai_production_db`, `db_master`); where a provider's password policy forbids
   that (the OpenSearch FGAC domain), use a hand-picked `override_special` that excludes
   `% # ? @ / :` and every shell metacharacter, plus `min_*` floors so the policy is guaranteed.
4. **Rotate through the tool that owns the credential.** An out-of-band `aws rds
   modify-db-instance` left Terraform state recording a password that no longer existed. If
   Terraform generates it, rotate with `-replace=random_password.X`.

**And one rule about verifying access changes:** when tightening a credential, test the **allow**
path, not only the deny paths. A scoped OpenSearch role passed all four intended denials while also
silently failing every *write* — which would have degraded the nightly ETL to "Postgres lands,
OpenSearch indexes nothing" with no error surfaced. Deny-only testing would have shipped it.
