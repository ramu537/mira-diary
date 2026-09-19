import assert from "node:assert/strict";
import test from "node:test";
import { blankExperience, experiencePayload, sanitizeExperienceTags, typeDetails } from "../src/lib/experiences.js";

test("new experiences are private and never invent trip or transaction dates", () => {
  const travel = blankExperience("TRAVEL");
  const movie = blankExperience("MOVIE");
  assert.equal(travel.experienceType, "TRAVEL");
  assert.equal(travel.visibility, "PRIVATE");
  assert.equal(travel.startDate, null);
  assert.equal(travel.occurredOn, null);
  assert.equal(movie.occurredOn, null);
  assert.equal(movie.startDate, null);
});

test("experience payload normalizes private structured fields", () => {
  const payload = experiencePayload({
    ...blankExperience("FOOD"),
    title: "  Late KFC stop  ",
    currency: "inr",
    rating: "4",
    overallCost: "850.50",
    tags: [" Kerala ", "kerala", "not valid"],
    moments: [{ id: 7, momentType: "FOOD", title: " Wings ", body: " Crisp and hot ", currency: "inr" }],
  });
  assert.equal(payload.title, "Late KFC stop");
  assert.equal(payload.currency, "INR");
  assert.equal(payload.rating, 4);
  assert.equal(payload.overallCost, 850.5);
  assert.deepEqual(payload.tags, ["kerala"]);
  assert.equal(payload.moments[0].id, 7);
  assert.equal(payload.moments[0].title, "Wings");
});

test("experience metadata covers every supported story type", () => {
  for (const type of ["TRAVEL", "MOVIE", "FOOD", "ACTIVITY", "GENERAL"]) {
    assert.equal(typeDetails(type).value, type);
  }
  assert.equal(sanitizeExperienceTags(["memory", "memory", "road-trip"]).length, 2);
});

test("trip chapter numbers use dates rather than a moment's position", () => {
  const payload = experiencePayload({
    ...blankExperience("TRAVEL"), startDate: "2026-09-01",
    moments: [
      { momentType: "MEMORY", title: "Dinner", momentDate: "2026-09-03", dayNumber: 1 },
      { momentType: "MEMORY", title: "Walk", momentDate: "2026-09-03", dayNumber: 2 },
      { momentType: "MEMORY", title: "Undated memory", momentDate: null, dayNumber: null },
    ],
  });
  assert.deepEqual(payload.moments.map((moment) => moment.dayNumber), [3, 3, null]);
});
