import { Clapperboard, Compass, Sparkles, Ticket, UtensilsCrossed } from "lucide-react";

export const experienceTypes = [
  { value: "TRAVEL", label: "Travel", noun: "journey", icon: Compass, tone: "travel", prompt: "Where did the journey take you?" },
  { value: "MOVIE", label: "Movie", noun: "watch", icon: Clapperboard, tone: "movie", prompt: "What stayed with you after the credits?" },
  { value: "FOOD", label: "Food", noun: "meal", icon: UtensilsCrossed, tone: "food", prompt: "What made this meal worth remembering?" },
  { value: "ACTIVITY", label: "Activity", noun: "outing", icon: Ticket, tone: "activity", prompt: "What did it feel like to be there?" },
  { value: "GENERAL", label: "Memory", noun: "memory", icon: Sparkles, tone: "general", prompt: "Tell this memory in your own words." },
];

export const momentTypes = ["DAY", "JOURNEY", "STAY", "RESTAURANT", "ACTIVITY", "MOVIE", "FOOD", "MEMORY"];
export const recommendations = [
  ["STRONGLY_RECOMMEND", "Strongly recommend"], ["RECOMMEND", "Recommend"],
  ["MAYBE", "Maybe"], ["NOT_RECOMMEND", "Wouldn’t recommend"],
];

export function typeDetails(value) {
  return experienceTypes.find((item) => item.value === value) || experienceTypes.at(-1);
}

export function blankExperience(type = "TRAVEL") {
  const today = new Date().toLocaleDateString("en-CA");
  return {
    experienceType: type, title: "", subtitle: "", summary: "", story: "", startDate: type === "TRAVEL" ? today : null,
    endDate: type === "TRAVEL" ? today : null, occurredOn: type === "TRAVEL" ? null : today, placeName: "", location: "",
    venue: "", category: "", companions: "", rating: null, recommendation: null, overallCost: null, currency: "INR",
    state: "DRAFT", tags: [], moments: [], media: [], coverMediaId: null, version: null,
  };
}

export function blankMoment(type = "MEMORY", index = 0) {
  return { id: null, momentType: type, title: "", body: "", momentDate: null, dayNumber: index + 1,
    placeName: "", location: "", rating: null, recommendation: null, cost: null, currency: "INR" };
}

export function sanitizeExperienceTags(tags) {
  return [...new Set((tags || []).map((tag) => String(tag).trim().toLowerCase())
    .filter((tag) => /^[a-z0-9][a-z0-9_-]{0,29}$/.test(tag)))].slice(0, 12);
}

const text = (value, limit) => String(value || "").trim().slice(0, limit);
const numberOrNull = (value) => value === "" || value === null || value === undefined ? null : Number(value);

export function experiencePayload(value) {
  return {
    experienceType: value.experienceType, title: text(value.title, 160), subtitle: text(value.subtitle, 240),
    summary: text(value.summary, 600), story: text(value.story, 100000), startDate: value.startDate || null,
    endDate: value.endDate || null, occurredOn: value.occurredOn || null, placeName: text(value.placeName, 180),
    location: text(value.location, 300), venue: text(value.venue, 180), category: text(value.category, 100),
    companions: text(value.companions, 300), rating: numberOrNull(value.rating), recommendation: value.recommendation || null,
    overallCost: numberOrNull(value.overallCost), currency: text(value.currency || "INR", 3).toUpperCase(),
    state: value.state || "DRAFT", tags: sanitizeExperienceTags(value.tags), version: value.version,
    moments: (value.moments || []).map((item, index) => ({ id: item.id || null, momentType: item.momentType,
      title: text(item.title, 160), body: text(item.body, 20000), momentDate: item.momentDate || null,
      dayNumber: value.experienceType === "TRAVEL" && item.momentType === "DAY" ? index + 1 : numberOrNull(item.dayNumber), placeName: text(item.placeName, 180), location: text(item.location, 300),
      rating: numberOrNull(item.rating), recommendation: item.recommendation || null, cost: numberOrNull(item.cost),
      currency: text(item.currency || value.currency || "INR", 3).toUpperCase() })),
  };
}

export function experienceDate(value) {
  const date = value.startDate || value.occurredOn || value.createdAt?.slice(0, 10);
  if (!date) return "Date not added";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T12:00:00`));
}

export function recommendationLabel(value) {
  return recommendations.find(([key]) => key === value)?.[1] || "";
}
