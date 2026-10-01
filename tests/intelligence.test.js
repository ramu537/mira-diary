import assert from "node:assert/strict";
import test from "node:test";
import { intelligenceCopy, normalizeEvidence } from "../src/lib/intelligence.js";

test("journal intelligence accepts aggregate evidence", () => {
  assert.equal(normalizeEvidence({ published: 2 })[0].value, 2);
  assert.equal(intelligenceCopy({ assistantInterpretation: "Finish the Kerala story" }), "Finish the Kerala story");
});
