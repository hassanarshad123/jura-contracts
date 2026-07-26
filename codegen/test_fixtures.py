"""Cross-language golden fixture test (Phase 3.1.3), Python side.

Every fixture in fixtures/ must validate against its matching generated Pydantic model. The
TypeScript side of parity is proven by codegen/fixtures.test.mjs (node --test) - run both to
prove the pipeline, not just one side.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "generated" / "python"))

from juraai_contracts.authority_identity import AuthorityIdentity
from juraai_contracts.neutral_citation import NeutralCitation
from juraai_contracts.reported_citation import ReportedCitation
from juraai_contracts.trivial_ping import TrivialPing


def _load_fixture(name: str) -> dict:
    return json.loads((ROOT / "fixtures" / name).read_text(encoding="utf-8"))


def test_trivial_ping_fixture_validates_against_the_generated_pydantic_model() -> None:
    fixture = _load_fixture("trivial-ping.json")
    model = TrivialPing(**fixture)
    assert model.message == "hello from a golden fixture"
    assert model.count == 42


def test_generated_pydantic_model_rejects_an_extra_field() -> None:
    with pytest.raises(ValidationError):
        TrivialPing(message="x", count=1, extra="not allowed")


def test_neutral_citation_fixture_validates_against_the_generated_pydantic_model() -> None:
    model = NeutralCitation(**_load_fixture("neutral-citation.json"))
    assert model.canonical == "JR-2019-SC-0007"


def test_reported_citation_fixture_validates_against_the_generated_pydantic_model() -> None:
    model = ReportedCitation(**_load_fixture("reported-citation.json"))
    assert model.canonical == "PLD 2019 SC 675"


def test_authority_identity_fixture_validates_against_the_generated_pydantic_model() -> None:
    model = AuthorityIdentity(**_load_fixture("authority-identity.json"))
    assert model.id == "auth_0001"
    assert model.court_level == 5


def test_authority_identity_defaults_reported_citations_to_empty_list() -> None:
    fixture = _load_fixture("authority-identity.json")
    del fixture["reported_citations"]
    model = AuthorityIdentity(**fixture)
    assert model.reported_citations == []
