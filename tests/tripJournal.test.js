import assert from "node:assert/strict";
import test from "node:test";
import { dateNumber, dayNumber, groupMoments, memoryPassport, quickMoments, safeSharingOptions, sharingPayload, tripDays } from "../src/lib/tripJournal.js";

const trip = { experienceType: "TRAVEL", startDate: "2026-09-01", endDate: "2026-09-04", currency: "INR", moments: [], media: [] };
test("dates are validated and day numbers come from dates, not position", () => {
  assert.equal(dateNumber("2026-02-30"), null);
  assert.equal(dayNumber("2026-08-31", "2026-09-02"), 3);
  assert.equal(dayNumber(null, "2026-09-02"), null);
  assert.equal(dayNumber("2026-09-04", "2026-09-02"), null);
  assert.deepEqual(tripDays(trip), ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]);
});
test("bullet catch-up preserves words and assigns only the selected context", () => {
  const result = quickMoments({ text: "- Great appam\n• Sunset ferry", kind: "MEMORY", date: "2026-09-02", experience: trip, batch: true });
  assert.equal(result.length, 2);
  assert.equal(result[0].body, "Great appam");
  assert.equal(result[1].dayNumber, 2);
  assert.equal(result[1].cost, null);
  assert.equal(result[1].placeName, "");
  assert.equal(quickMoments({ text: "A memory", kind: "MEMORY", date: "", experience: trip })[0].momentDate, null);
});
test("capture validates date bounds, empty input and moment limits", () => {
  assert.throws(() => quickMoments({ text: "", kind: "MEMORY", date: "", experience: trip }), /thought/);
  assert.throws(() => quickMoments({ text: "Day one", kind: "MEMORY", date: "2026-08-31", experience: trip }), /before/);
  assert.throws(() => quickMoments({ text: "Later", kind: "MEMORY", date: "2026-09-05", experience: trip }), /after/);
  assert.throws(() => quickMoments({ text: "More", kind: "MEMORY", date: "", experience: { ...trip, moments: Array(100).fill({}) } }), /100/);
});
test("grouping keeps order within a day and leaves undated moments separate", () => {
  const result = groupMoments({ ...trip, moments: [{ id: 1, momentDate: null }, { id: 2, momentDate: "2026-09-03" }, { id: 3, momentDate: "2026-09-01" }, { id: 4, momentDate: "2026-09-03" }] });
  assert.deepEqual(result.map((group) => group.day), [1, 3, null]);
  assert.deepEqual(result[1].moments.map((item) => item.id), [2, 4]);
});
test("passport milestones do not depend on publication or clicks", () => {
  assert.ok(memoryPassport(null).every((stamp) => !stamp.earned));
  const draft = { ...trip, visibility: "PRIVATE", moments: [{ momentDate: "2026-09-01" }, { momentDate: "2026-09-02" }, { momentDate: "2026-09-03", recommendation: "RECOMMEND" }], media: [{ id: "photo" }] };
  assert.ok(memoryPassport(draft).every((stamp) => stamp.earned));
  assert.deepEqual(memoryPassport(draft), memoryPassport({ ...draft, visibility: "PUBLIC" }));
});
test("new sharing starts conservatively and old sharing never includes new content silently", () => {
  const experience = { ...trip, moments: [{ id: 1 }, { id: 2 }], media: [{ id: "first", momentId: 1 }, { id: "new", momentId: 2 }] };
  const initial = safeSharingOptions(experience, null);
  assert.equal(initial.visibility, "UNLISTED");
  assert.equal(initial.includeLocation, false);
  assert.equal(initial.includeMedia, false);
  const existing = safeSharingOptions(experience, { visibility: "PUBLIC", options: { includeLocation: false, includeMedia: true, excludedMomentIds: [], includedMediaIds: ["first"] }, snapshot: { moments: [{ id: 1 }], media: [{ id: "first" }] } });
  assert.deepEqual(existing.excludedMomentIds, [2]);
  assert.deepEqual(existing.includedMediaIds, ["first"]);
  assert.equal(existing.includeLocation, false);
});
test("excluding a moment also excludes its photos from the wire payload", () => {
  const experience = { ...trip, media: [{ id: "hidden", momentId: 1 }, { id: "visible", momentId: 2 }, { id: "cover", momentId: null }] };
  const options = { includeMedia: true, excludedMomentIds: [1], includedMediaIds: ["hidden", "visible", "cover", "foreign"] };
  assert.deepEqual(sharingPayload(options, experience).includedMediaIds, ["visible", "cover"]);
  assert.deepEqual(sharingPayload({ ...options, includeMedia: false }, experience).includedMediaIds, []);
});
