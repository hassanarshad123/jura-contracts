"""Round-trip fixture test (Phase 3.2.4), Python side. Every CitatorFinding value must produce
its documented GoodLawStatus through the generated + hand-maintained mapping code. The TS side is
proven independently by good-law-mapping.test.mjs."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "generated" / "python"))
sys.path.insert(0, str(ROOT / "validators" / "python"))

from juraai_contracts.citator_finding import CitatorFinding
from juraai_contracts.good_law_status import GoodLawStatus

from juraai_contracts_validators.good_law_mapping import to_good_law_status


def _fixtures() -> list[dict]:
    return json.loads((ROOT / "fixtures" / "good-law-mapping.json").read_text(encoding="utf-8"))


def test_every_citator_finding_value_in_the_fixture_maps_to_its_documented_status() -> None:
    fixtures = _fixtures()
    assert len(fixtures) == len(list(CitatorFinding)), (
        "the fixture must cover every CitatorFinding value - update it if the enum grows"
    )
    for row in fixtures:
        finding = CitatorFinding(row["finding"])
        actual = to_good_law_status(finding)
        assert isinstance(actual, GoodLawStatus)
        assert actual.value == row["expected_status"], (
            f"{finding} -> expected {row['expected_status']}, got {actual.value}"
        )
