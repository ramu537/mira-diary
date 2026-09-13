import { dateRange, shiftDate } from "./dates.js";

export const moods = [
  { value: "ROUGH", label: "Rough", score: 1, token: "var(--mood-rough)" },
  { value: "LOW", label: "Low", score: 2, token: "var(--mood-low)" },
  { value: "STEADY", label: "Steady", score: 3, token: "var(--mood-steady)" },
  { value: "GOOD", label: "Good", score: 4, token: "var(--mood-good)" },
  { value: "GREAT", label: "Great", score: 5, token: "var(--mood-great)" },
];

export const diaryPrompts = [
  "What small moment deserves to be remembered?",
  "What felt lighter today?",
  "What gave you energy, and what took it away?",
  "What did today teach you about yourself?",
  "Where did you choose courage over comfort?",
  "What are you quietly proud of?",
  "What needed more patience today?",
  "What surprised you in a good way?",
  "What would make tomorrow feel meaningful?",
  "Who or what made today kinder?",
  "What would you like to leave behind today?",
  "What are you carrying that is not yours?",
];

export function promptForDate(dateKey, offset = 0) {
  const seed = dateKey.split("-").reduce((total, part) => total + Number(part), 0);
  return diaryPrompts[(seed + offset + diaryPrompts.length) % diaryPrompts.length];
}

export function blankEntry(entryDate) {
  return { entryDate, mood: null, energy: null, sleepHours: null, highlight: "", content: "", gratitudeOne: "", gratitudeTwo: "", gratitudeThree: "", prompt: promptForDate(entryDate), tags: [] };
}

export function sanitizeTags(tags) {
  return Array.from(new Set((tags || []).map((tag) => String(tag).trim().toLocaleLowerCase())
    .filter((tag) => /^[a-z0-9][a-z0-9_-]{0,29}$/.test(tag)))).slice(0, 10);
}

export function entryPayload(entry) {
  const energy = entry.energy == null ? null : Math.min(5, Math.max(1, Number(entry.energy)));
  const sleep = entry.sleepHours == null || entry.sleepHours === "" ? null : Math.min(24, Math.max(0, Number(entry.sleepHours)));
  return {
    mood: moods.some((mood) => mood.value === entry.mood) ? entry.mood : null,
    energy: Number.isInteger(energy) ? energy : null,
    sleepHours: Number.isFinite(sleep) ? sleep : null,
    highlight: String(entry.highlight || "").trim().slice(0, 200),
    content: String(entry.content || "").slice(0, 100_000),
    gratitudeOne: String(entry.gratitudeOne || "").trim().slice(0, 200),
    gratitudeTwo: String(entry.gratitudeTwo || "").trim().slice(0, 200),
    gratitudeThree: String(entry.gratitudeThree || "").trim().slice(0, 200),
    prompt: String(entry.prompt || "").trim().slice(0, 250),
    tags: sanitizeTags(entry.tags),
  };
}

export function wordCount(value = "") {
  return value.trim().match(/\S+/gu)?.length || 0;
}

export function moodDetails(value) {
  return moods.find((mood) => mood.value === value) || null;
}

export function onThisDay(entries, selectedDate) {
  const monthDay = selectedDate.slice(5);
  return entries.filter((entry) => entry.entryDate < selectedDate && entry.entryDate.slice(5) === monthDay)
    .sort((left, right) => right.entryDate.localeCompare(left.entryDate));
}

export function diarySummary(entries, today) {
  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry]));
  let currentStreak = 0;
  let cursor = byDate.has(today) ? today : shiftDate(today, -1);
  while (byDate.has(cursor) && currentStreak < 1827) { currentStreak += 1; cursor = shiftDate(cursor, -1); }

  let bestStreak = 0;
  let run = 0;
  let previous = null;
  [...entries].sort((left, right) => left.entryDate.localeCompare(right.entryDate)).forEach((entry) => {
    run = previous && shiftDate(previous, 1) === entry.entryDate ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = entry.entryDate;
  });

  const recentSet = new Set(dateRange(today, 30));
  const recent = entries.filter((entry) => recentSet.has(entry.entryDate));
  const moodScores = recent.map((entry) => moodDetails(entry.mood)?.score).filter(Boolean);
  const sleepValues = recent
    .filter((entry) => entry.sleepHours !== null && entry.sleepHours !== undefined && entry.sleepHours !== "")
    .map((entry) => Number(entry.sleepHours))
    .filter((value) => Number.isFinite(value));
  return {
    currentStreak,
    bestStreak,
    entries: entries.length,
    totalWords: entries.reduce((total, entry) => total + wordCount(entry.content), 0),
    averageMood: moodScores.length ? moodScores.reduce((total, score) => total + score, 0) / moodScores.length : 0,
    moodEntries: moodScores.length,
    averageSleep: sleepValues.length ? sleepValues.reduce((total, hours) => total + hours, 0) / sleepValues.length : 0,
    sleepEntries: sleepValues.length,
  };
}

export function insightData(entries, today) {
  const days = dateRange(today, 30);
  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry]));
  const moodSeries = days.map((date) => {
    const entry = byDate.get(date);
    const mood = moodDetails(entry?.mood);
    return { date, label: mood?.label || "Not rated", score: mood?.score || 0, token: mood?.token || null };
  });
  const moodMix = moods.map((mood) => ({ ...mood, count: moodSeries.filter((day) => day.score === mood.score).length }));
  const recentDates = new Set(days);
  const recentEntries = entries.filter((entry) => recentDates.has(entry.entryDate));
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const scored = recentEntries.filter((entry) => new Date(`${entry.entryDate}T12:00:00`).getDay() === index)
      .map((entry) => moodDetails(entry.mood)?.score).filter(Boolean);
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index], score: scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : 0, count: scored.length };
  });
  return { moodSeries, moodMix, weekdays };
}
