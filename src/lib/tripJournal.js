// Pure helpers shared by the editor, reader and regression tests.
const DAY = 86400000;
export const captureKinds = [
  ["MEMORY", "Memory", "What do you want to remember?"],
  ["RESTAURANT", "Food", "What tasted good? What would you order again?"],
  ["STAY", "Stay", "What was the stay like?"],
  ["JOURNEY", "Journey", "How did you get there?"],
  ["ACTIVITY", "Activity", "What made this worth doing?"],
  ["MOVIE", "Movie", "What stayed with you after the credits?"],
];
export const memoryPrompts = ["Best meal?", "An unexpected moment?", "A place worth returning to?", "One useful tip?", "How did the day feel?"];

export function dateNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const result = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(result) && new Date(result).toISOString().slice(0, 10) === value ? result : null;
}

export function dayNumber(start, date) {
  const first = dateNumber(start), next = dateNumber(date);
  if (first == null || next == null || next < first) return null;
  const day = Math.round((next - first) / DAY) + 1;
  return day <= 365 ? day : null;
}

export function tripDays(experience) {
  const dates = new Set((experience.moments || []).map((item) => item.momentDate).filter((date) => dateNumber(date) != null));
  const start = dateNumber(experience.startDate), end = dateNumber(experience.endDate);
  if (start != null) {
    // Bound rendering for long trips. Recorded dates are never discarded.
    const finish = end != null && end >= start ? Math.min(end, start + 364 * DAY) : start;
    for (let value = start; value <= finish; value += DAY) dates.add(new Date(value).toISOString().slice(0, 10));
  }
  return [...dates].sort();
}

export function groupMoments(experience) {
  const groups = new Map();
  for (const moment of experience.moments || []) {
    const key = moment.momentDate || "undated";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(moment);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, moments]) => ({
    date: date === "undated" ? null : date,
    day: experience.experienceType === "TRAVEL" ? dayNumber(experience.startDate, date) : null,
    moments,
  }));
}

export function quickMoments({ text, kind, date, experience, batch = false }) {
  const lines = batch ? text.split(/\r?\n/).map((line) => line.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean) : [text.trim()];
  if (!lines.length || lines.some((line) => !line)) throw new Error("Add a thought or choose photos first.");
  if (lines.length + (experience.moments?.length || 0) > 100) throw new Error("Keep up to 100 moments per experience.");
  if (date && dateNumber(date) == null) throw new Error("Choose a valid moment date.");
  if (date && experience.startDate && date < experience.startDate) throw new Error("This date is before the trip. Update the trip dates first.");
  if (date && experience.endDate && date > experience.endDate) throw new Error("This date is after the trip. Update the trip dates first.");
  if (lines.some((line) => line.length > 20000)) throw new Error("Keep each moment under 20,000 characters.");
  return lines.map((line) => ({
    id: null, momentType: kind, title: line.split(/\r?\n/)[0].slice(0, 160),
    body: line, momentDate: date || null,
    dayNumber: experience.experienceType === "TRAVEL" ? dayNumber(experience.startDate, date) : null,
    placeName: "", location: "", rating: null, recommendation: null, cost: null, currency: experience.currency || "INR",
  }));
}

export function memoryPassport(saved) {
  const moments = saved?.moments || [];
  const days = new Set(moments.map((item) => item.momentDate).filter(Boolean)).size;
  return [
    { key: "moment", label: "First memory", detail: "Save a moment", earned: moments.length > 0 },
    { key: "photo", label: "Picture keeper", detail: "Add a photo", earned: (saved?.media?.length || 0) > 0 },
    { key: "days", label: "Three chapters", detail: "Capture three different days", earned: days >= 3 },
    { key: "tip", label: "Worth remembering", detail: "Leave a recommendation", earned: Boolean(saved?.recommendation || moments.some((item) => item.recommendation)) },
  ];
}

export function safeSharingOptions(experience, publication) {
  const previous = publication?.options;
  const snapshot = publication?.snapshot;
  const visibleMoments = new Set((snapshot?.moments || []).map((item) => item.id));
  const visibleMedia = new Set((snapshot?.media || []).map((item) => item.id));
  const selectedIds = new Set(previous?.includedMediaIds || [...visibleMedia]);
  const excluded = new Set(previous?.excludedMomentIds || []);
  return {
    visibility: publication?.visibility === "PUBLIC" ? "PUBLIC" : "UNLISTED",
    includeLocation: previous?.includeLocation ?? Boolean(snapshot?.placeName || snapshot?.location || snapshot?.venue),
    includeCompanions: previous?.includeCompanions ?? Boolean(snapshot?.companions),
    includeCosts: previous?.includeCosts ?? (snapshot?.overallCost != null || Boolean(snapshot?.moments?.some((item) => item.cost != null))),
    includeMedia: previous?.includeMedia ?? visibleMedia.size > 0,
    // New moments never enter an existing publication simply because the panel was reopened.
    excludedMomentIds: (experience.moments || []).filter((item) => publication ? excluded.has(item.id) || !visibleMoments.has(item.id) : false).map((item) => item.id),
    includedMediaIds: (experience.media || []).filter((item) => selectedIds.has(item.id)).map((item) => item.id),
  };
}

export function sharingPayload(options, experience) {
  const excluded = new Set(options.excludedMomentIds);
  const allowed = new Set((experience.media || []).filter((item) => !item.momentId || !excluded.has(item.momentId)).map((item) => item.id));
  return { ...options, includedMediaIds: options.includeMedia ? options.includedMediaIds.filter((id) => allowed.has(id)) : [] };
}
