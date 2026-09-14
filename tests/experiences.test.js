import assert from "node:assert/strict";
import test from "node:test";
import { blankExperience, experiencePayload, sanitizeExperienceTags, typeDetails } from "../src/lib/experiences.js";

test("blank experiences adapt their date fields to the selected type", () => {
  const travel = blankExperience("TRAVEL");
  const movie = blankExperience("MOVIE");
  assert.equal(travel.experienceType, "TRAVEL");
  assert.ok(travel.startDate);
  assert.equal(travel.occurredOn, null);
  assert.ok(movie.occurredOn);
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
