import assert from "node:assert/strict";
import test from "node:test";
import { blankEntry, diarySummary, entryPayload, insightData, moodDetails, onThisDay, promptForDate, sanitizeTags, wordCount } from "../src/lib/diary.js";

const entries = [
  { ...blankEntry("2026-09-10"), id: 1, mood: "STEADY", sleepHours: 7, content: "A steady ordinary day" },
  { ...blankEntry("2026-09-11"), id: 2, mood: "GOOD", sleepHours: 8, content: "A good day" },
  { ...blankEntry("2026-09-12"), id: 3, mood: "GREAT", sleepHours: null, content: "A genuinely great day" },
  { ...blankEntry("2025-09-13"), id: 4, mood: "LOW", highlight: "A memory from last year", content: "A difficult moment" },
];

test("blankEntry is complete and prompt selection is deterministic", () => {
  assert.equal(blankEntry("2026-09-13").prompt, promptForDate("2026-09-13"));
  assert.deepEqual(blankEntry("2026-09-13").tags, []);
});

test("entryPayload clamps numeric values and sanitizes tags", () => {
  const payload = entryPayload({ ...blankEntry("2026-09-13"), energy: 8, sleepHours: 25, tags: [" Calm ", "calm", "not valid!"] });
  assert.equal(payload.energy, 5);
  assert.equal(payload.sleepHours, 24);
  assert.deepEqual(payload.tags, ["calm"]);
  assert.deepEqual(sanitizeTags(["valid_tag", "-bad"]), ["valid_tag"]);
});

test("diarySummary calculates streaks only from written entries", () => {
  const summary = diarySummary(entries, "2026-09-13");
  assert.equal(summary.currentStreak, 3);
  assert.equal(summary.bestStreak, 3);
  assert.equal(summary.entries, 4);
  assert.equal(summary.averageMood, 4);
  assert.equal(summary.averageSleep, 7.5);
  assert.equal(summary.totalWords, 14);
});

test("insightData keeps unrated days explicit", () => {
  const data = insightData(entries, "2026-09-13");
  assert.equal(data.moodSeries.length, 30);
  assert.equal(data.moodSeries.at(-1).score, 0);
  assert.equal(data.moodMix.find((mood) => mood.value === "GREAT").count, 1);
  assert.equal(moodDetails("GOOD").score, 4);
});

test("onThisDay returns only earlier matching dates", () => {
  assert.deepEqual(onThisDay(entries, "2026-09-13").map((entry) => entry.entryDate), ["2025-09-13"]);
  assert.equal(wordCount("A few honest words"), 4);
});
