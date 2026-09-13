import assert from "node:assert/strict";
import test from "node:test";
import { dateRange, shiftDate } from "../src/lib/dates.js";

test("shiftDate crosses calendar boundaries", () => {
  assert.equal(shiftDate("2026-09-30", 1), "2026-10-01");
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
});

test("dateRange ends on the requested day", () => {
  assert.deepEqual(dateRange("2026-09-13", 3), ["2026-09-11", "2026-09-12", "2026-09-13"]);
});

