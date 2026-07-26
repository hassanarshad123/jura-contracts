/**
 * The CitatorFinding -> GoodLawStatus mapping (Phase 3.2 of the engineering foundation plan).
 *
 * NOT auto-generated - this is exactly the kind of cross-field/semantic logic JSON Schema can't
 * express, so it's hand-maintained here rather than baked into the generated types. See
 * ../../../schemas/good-law-status-MAPPING.md for the full vocabulary inventory and reasoning.
 *
 * This mapping is a legal-accuracy decision, not just a data-modeling one - collapsing an
 * evidentiary finding ("no negative treatment found in the reported corpus") into a legal
 * conclusion ("good law") changes what's asserted to a lawyer. Per the standing project decision
 * there is no separate formal legal sign-off gate on this file, but per checkpoint 3.2.5, a human
 * spot-check of this exact mapping against a sample of real judgments is a precondition on any
 * production cutover (Phase 5.5.5) - do not treat this file as final until that's happened.
 */
import type { CitatorFinding } from "../../../generated/typescript/src/citator-finding.js";
import type { GoodLawStatus } from "../../../generated/typescript/src/good-law-status.js";

/**
 * Maps the evidentiary ground truth (what jura-data's citator actually found) to the display
 * conclusion (what a lawyer sees). Total and exhaustive over every `CitatorFinding` value - a
 * TypeScript exhaustiveness check (the `never` branch) fails to compile if a new `CitatorFinding`
 * value is ever added to the schema without a corresponding mapping decision here.
 */
export function toGoodLawStatus(finding: CitatorFinding): GoodLawStatus {
  switch (finding) {
    // Deterministic appeal-history reversal and citation-network overruling both mean the same
    // thing to a lawyer: this case is no longer good law due to a superior determination.
    case "reversed":
    case "overruled":
      return "overruled";

    // Structural invalidation (statute repealed/struck down) - not a citation-network finding,
    // but the same practical meaning: this authority no longer stands.
    case "superseded":
      return "superseded";

    // Both "questioned" (criticized/limited by a competent bench) and "caution" (conflicting or
    // coordinate-bench treatment, incl. "distinguished") mean the case's authority is in doubt
    // but NOT displaced - intentionally collapsed to one display value. This IS a real
    // simplification (two distinct evidentiary situations become one badge), judged acceptable
    // because both already mean "read this case's continuing authority carefully" to a lawyer -
    // neither is a clean "good" nor a clean "overruled" signal. Flag if this collapse ever proves
    // too coarse in practice (e.g. if the golive spot-check disagrees).
    case "questioned":
    case "caution":
      return "doubted";

    // A clean evidentiary absence-of-negative-treatment claim, with coverage adequate to make it
    // honestly (goodlaw.py's own coverage-gate logic already enforces this upstream) - the direct
    // "good" case.
    case "no_negative_found":
      return "good";

    // NOTE - the one real semantic gap: jura-app's original `untracked` meant "the PK good-law
    // graph doesn't cover this jurisdiction at all" (a coverage-EXISTENCE gap). CitatorFinding's
    // `insufficient_data` means something narrower: this IS a PK case with a real citation graph,
    // but there are too few resolved citations to assess treatment (a coverage-DENSITY gap within
    // an otherwise-tracked jurisdiction). These are not the same claim, but the practical effect
    // for a lawyer is identical either way - an honest "we can't tell you" rather than a fabricated
    // green or red badge - so they share the display value. Documented here rather than silently
    // conflated; revisit if the UI ever needs to distinguish "not tracked" from "tracked but thin."
    case "insufficient_data":
      return "untracked";

    default: {
      const _exhaustive: never = finding;
      throw new Error(`unmapped CitatorFinding value: ${_exhaustive as string}`);
    }
  }
}
