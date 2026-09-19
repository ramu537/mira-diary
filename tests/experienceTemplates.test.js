import assert from "node:assert/strict";
import test from "node:test";
import { entryExcerpt, experienceTemplates, makeMoment, moveMomentWithinDay, newExperiencePath, templateFor, typeForRoute, wordCount, writeDay } from "../src/lib/experienceTemplates.js";

const trip = { experienceType: "TRAVEL", startDate: "2026-09-01", endDate: "2026-09-03", currency: "INR", moments: [] };

test("each experience has its own creation route and type", () => {
  assert.equal(new Set(experienceTemplates.map((item) => newExperiencePath(item.type))).size, 5);
  for (const item of experienceTemplates) {
    assert.equal(typeForRoute(item.route), item.type);
    assert.equal(templateFor(item.type).route, item.route);
    assert.equal(newExperiencePath(item.type), `/experiences/new/${item.route}`);
  }
  assert.equal(typeForRoute("unknown"), null);
  assert.equal(templateFor("unknown").type, "GENERAL");
});

test("day writing updates the existing chapter without replacing stops or IDs", () => {
  const chapter = { id: 10, momentType: "DAY", momentDate: "2026-09-02", title: "Backwaters", body: "Old words", rating: 4 };
  const stop = { id: 11, momentType: "RESTAURANT", momentDate: "2026-09-02", title: "Lunch", body: "Great appam" };
  const updated = writeDay({ ...trip, moments: [chapter, stop] }, "2026-09-02", "More to remember");
  assert.equal(updated.length, 2);
  assert.deepEqual(updated[0], { ...chapter, body: "More to remember" });
  assert.equal(updated[1], stop);
  assert.equal(chapter.body, "Old words");
});

test("opening an empty day never creates placeholder records", () => {
  assert.equal(writeDay(trip, "2026-09-01", "  "), trip.moments);
  const result = writeDay(trip, "2026-09-02", "A good day");
  assert.equal(result.length, 1);
  assert.equal(result[0].momentType, "DAY");
  assert.equal(result[0].dayNumber, 2);
  assert.equal(result[0].title, "Day 2");
  assert.equal(result[0].body, "A good day");
});

test("chapter writing is bounded and does not invent dates or places", () => {
  assert.throws(() => writeDay(trip, "2026-08-31", "Early"), /before/);
  assert.throws(() => writeDay(trip, "2026-09-04", "Late"), /after/);
  assert.throws(() => writeDay(trip, "2026-02-30", "Invalid"), /valid/);
  assert.throws(() => writeDay({ ...trip, moments: Array(100).fill({ momentType: "MEMORY" }) }, "2026-09-02", "New"), /100/);
  const undated = writeDay(trip, "", "An undated memory")[0];
  assert.equal(undated.momentDate, null);
  assert.equal(undated.dayNumber, null);
  assert.equal(undated.placeName, "");
});

test("legacy additional DAY records are preserved rather than silently merged", () => {
  const first = { id: 1, momentType: "DAY", momentDate: "2026-09-01", body: "First" };
  const second = { id: 2, momentType: "DAY", momentDate: "2026-09-01", body: "Separate record" };
  const result = writeDay({ ...trip, moments: [first, second] }, "2026-09-01", "Edited");
  assert.equal(result[1], second);
  assert.equal(result[0].id, first.id);
});

test("dishes and other short-form notes retain the parent currency, without trip numbering", () => {
  const dish = makeMoment("FOOD", "2026-09-02", { ...trip, experienceType: "FOOD", currency: "USD" }, "Appam");
  assert.equal(dish.dayNumber, null);
  assert.equal(dish.currency, "USD");
  assert.equal(dish.title, "Appam");
  assert.equal(dish.cost, null);
  assert.equal(dish.recommendation, null);
});

test("moving a note only changes its order within the same day", () => {
  const moments = [{ id: 1, momentDate: "2026-09-01" }, { id: 2, momentDate: "2026-09-02" }, { id: 3, momentDate: "2026-09-01" }];
  assert.deepEqual(moveMomentWithinDay(moments, 0, 1).map((item) => item.id), [3, 2, 1]);
  assert.equal(moveMomentWithinDay(moments, 1, 1), moments);
  assert.equal(moveMomentWithinDay(moments, 0, -1), moments);
  assert.deepEqual(moments.map((item) => item.id), [1, 2, 3]);
});

test("library excerpts include old note-based entries, without generating prose", () => {
  assert.equal(entryExcerpt({ moments: [{ body: "My old review" }] }), "My old review");
  assert.equal(entryExcerpt({ summary: "Verdict", story: "Long review" }), "Verdict");
  assert.equal(entryExcerpt({}), "");
  assert.equal(wordCount("  Two words\nplus one  "), 4);
});
