// Round-trip fixture test (Phase 3.2.4): every CitatorFinding value must produce its documented
// GoodLawStatus through the generated + hand-maintained mapping code - not hand-duplicated
// per-test logic. The Python side is proven independently by test_good_law_mapping.py.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CitatorFindingSchema } from "../../../generated/typescript/src/citator-finding.ts";
import { GoodLawStatusSchema } from "../../../generated/typescript/src/good-law-status.ts";
import { toGoodLawStatus } from "./good-law-mapping.ts";

const ROOT = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

const fixtures = JSON.parse(
  readFileSync(join(ROOT, "fixtures", "good-law-mapping.json"), "utf-8"),
);

test("every CitatorFinding value in the fixture maps to its documented GoodLawStatus", () => {
  assert.equal(
    fixtures.length,
    CitatorFindingSchema.options.length,
    "the fixture must cover every CitatorFinding value - update it if the schema grows",
  );
  for (const { finding, expected_status } of fixtures) {
    const parsedFinding = CitatorFindingSchema.parse(finding);
    const actual = toGoodLawStatus(parsedFinding);
    assert.equal(GoodLawStatusSchema.safeParse(actual).success, true);
    assert.equal(actual, expected_status, `${finding} -> expected ${expected_status}, got ${actual}`);
  }
});
