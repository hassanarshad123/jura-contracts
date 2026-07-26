// Cross-language golden fixture test (Phase 3.1.3): every fixture in fixtures/ must validate
// against its matching generated TS schema. The Python side of parity is proven by
// validators/python/test_fixtures.py (pytest) - run both to prove the pipeline, not just one side.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TrivialPingSchema } from "../generated/typescript/src/trivial-ping.ts";
import { NeutralCitationSchema } from "../generated/typescript/src/neutral-citation.ts";
import { ReportedCitationSchema } from "../generated/typescript/src/reported-citation.ts";
import { AuthorityIdentitySchema } from "../generated/typescript/src/authority-identity.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function loadFixture(name) {
  return JSON.parse(readFileSync(join(ROOT, "fixtures", name), "utf-8"));
}

test("fixtures/trivial-ping.json validates against the generated TS schema", () => {
  const fixture = loadFixture("trivial-ping.json");
  const result = TrivialPingSchema.safeParse(fixture);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(result.data.message, "hello from a golden fixture");
  assert.equal(result.data.count, 42);
});

test("the generated TS schema rejects an extra field (strict/additionalProperties:false parity)", () => {
  const result = TrivialPingSchema.safeParse({ message: "x", count: 1, extra: "not allowed" });
  assert.equal(result.success, false);
});

test("fixtures/neutral-citation.json validates against the generated TS schema (3.3.1)", () => {
  const fixture = loadFixture("neutral-citation.json");
  const result = NeutralCitationSchema.safeParse(fixture);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(result.data.canonical, "JR-2019-SC-0007");
});

test("fixtures/reported-citation.json validates against the generated TS schema (3.3.1)", () => {
  const fixture = loadFixture("reported-citation.json");
  const result = ReportedCitationSchema.safeParse(fixture);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(result.data.canonical, "PLD 2019 SC 675");
});

test("fixtures/authority-identity.json validates against the generated TS schema (3.3.2)", () => {
  const fixture = loadFixture("authority-identity.json");
  const result = AuthorityIdentitySchema.safeParse(fixture);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(result.data.id, "auth_0001");
  assert.equal(result.data.court_level, 5);
});

test("AuthorityIdentity defaults reported_citations to [] when omitted", () => {
  const { reported_citations: _omit, ...rest } = loadFixture("authority-identity.json");
  const result = AuthorityIdentitySchema.safeParse(rest);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.deepEqual(result.data.reported_citations, []);
});
