"""The CitatorFinding -> GoodLawStatus mapping (Phase 3.2 of the engineering foundation plan).

NOT auto-generated - this is exactly the kind of cross-field/semantic logic JSON Schema can't
express, so it's hand-maintained here rather than baked into the generated types. See
../../../schemas/good-law-status-MAPPING.md for the full vocabulary inventory and reasoning, and
validators/typescript/src/good-law-mapping.ts for the TypeScript side (must stay in sync - the
round-trip fixture test in fixtures/ catches drift between the two).

This mapping is a legal-accuracy decision, not just a data-modeling one - collapsing an
evidentiary finding ("no negative treatment found in the reported corpus") into a legal
conclusion ("good law") changes what's asserted to a lawyer. Per the standing project decision
there is no separate formal legal sign-off gate on this file, but per checkpoint 3.2.5, a human
spot-check of this exact mapping against a sample of real judgments is a precondition on any
production cutover (Phase 5.5.5) - do not treat this file as final until that's happened.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "generated" / "python"))

from juraai_contracts.citator_finding import CitatorFinding
from juraai_contracts.good_law_status import GoodLawStatus

# Total, exhaustive mapping - every CitatorFinding value must appear as a key. A missing key
# raises KeyError rather than silently defaulting, so a new CitatorFinding value added to the
# schema without a corresponding mapping decision fails loudly, not silently.
_MAPPING: dict[CitatorFinding, GoodLawStatus] = {
    # Deterministic appeal-history reversal and citation-network overruling both mean the same
    # thing to a lawyer: this case is no longer good law due to a superior determination.
    CitatorFinding.reversed: GoodLawStatus.overruled,
    CitatorFinding.overruled: GoodLawStatus.overruled,
    # Structural invalidation - not a citation-network finding, but the same practical meaning.
    CitatorFinding.superseded: GoodLawStatus.superseded,
    # Both mean "authority in doubt, not displaced" - intentionally collapsed to one display
    # value (see the TS mapping's comment for the full reasoning on this simplification).
    CitatorFinding.questioned: GoodLawStatus.doubted,
    CitatorFinding.caution: GoodLawStatus.doubted,
    # A clean evidentiary absence-of-negative-treatment claim.
    CitatorFinding.no_negative_found: GoodLawStatus.good,
    # NOTE - the one real semantic gap: jura-app's original `untracked` meant "PK good-law graph
    # doesn't cover this jurisdiction at all" (a coverage-EXISTENCE gap); `insufficient_data` means
    # "this IS a tracked PK case but the citation graph is too thin to assess" (a coverage-DENSITY
    # gap). Different claims, same practical effect for a lawyer (an honest "we can't tell you"),
    # so they share the display value. Revisit if the UI ever needs to distinguish them.
    CitatorFinding.insufficient_data: GoodLawStatus.untracked,
}


def to_good_law_status(finding: CitatorFinding) -> GoodLawStatus:
    """Map the evidentiary ground truth to the display conclusion. Raises KeyError (fail loud,
    never fail silent) if `finding` has no mapping entry - see `_MAPPING`'s own comment."""
    return _MAPPING[finding]
