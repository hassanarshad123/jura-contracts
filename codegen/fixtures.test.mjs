// Cross-language golden fixture test (Phase 3.1.3): every fixture in fixtures/ must validate
// against its matching generated TS schema. The Python side of parity is proven by
// validators/python/test_fixtures.py (pytest) - run both to prove the pipeline, not just one side.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TrivialPingSchema } from "../generated/typescript/src/trivial-ping.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

test("fixtures/trivial-ping.json validates against the generated TS schema", () => {
  const fixture = JSON.parse(readFileSync(join(ROOT, "fixtures", "trivial-ping.json"), "utf-8"));
  const result = TrivialPingSchema.safeParse(fixture);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(result.data.message, "hello from a golden fixture");
  assert.equal(result.data.count, 42);
});

test("the generated TS schema rejects an extra field (strict/additionalProperties:false parity)", () => {
  const result = TrivialPingSchema.safeParse({ message: "x", count: 1, extra: "not allowed" });
  assert.equal(result.success, false);
});
