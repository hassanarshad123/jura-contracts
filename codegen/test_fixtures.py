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

from juraai_contracts.trivial_ping import TrivialPing


def test_trivial_ping_fixture_validates_against_the_generated_pydantic_model() -> None:
    fixture = json.loads((ROOT / "fixtures" / "trivial-ping.json").read_text(encoding="utf-8"))
    model = TrivialPing(**fixture)
    assert model.message == "hello from a golden fixture"
    assert model.count == 42


def test_generated_pydantic_model_rejects_an_extra_field() -> None:
    with pytest.raises(ValidationError):
        TrivialPing(message="x", count=1, extra="not allowed")
