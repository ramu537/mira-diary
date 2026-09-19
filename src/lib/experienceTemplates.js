import { dateNumber, dayNumber } from "./tripJournal.js";

export const experienceTemplates = [
  { type: "TRAVEL", route: "trip", name: "Trip", plural: "Trips", action: "Start a trip", description: "A journal for every day of the journey.", title: "Name your trip", story: "Before the journey", placeholder: "Where did you go, and what brought you there?" },
  { type: "MOVIE", route: "movie", name: "Movie", plural: "Movies", action: "Log a movie", description: "The film, your rating, your take.", title: "Film title", story: "Your review", placeholder: "What stayed with you after the credits?" },
  { type: "FOOD", route: "food", name: "Food", plural: "Food", action: "Remember a meal", description: "The place, the dishes, what to order again.", title: "Restaurant or meal", story: "How was it?", placeholder: "The first bite, the atmosphere, the service…" },
  { type: "ACTIVITY", route: "activity", name: "Activity", plural: "Activities", action: "Keep an activity", description: "What you did and what made it worthwhile.", title: "What did you do?", story: "The experience", placeholder: "What was it like to be there?" },
  { type: "GENERAL", route: "memory", name: "Memory", plural: "Memories", action: "Write a memory", description: "A blank page for something worth keeping.", title: "Give this memory a title", story: "Your memory", placeholder: "Start anywhere. This is your space." },
];

export function templateFor(type) { return experienceTemplates.find((item) => item.type === type) || experienceTemplates[4]; }
export function typeForRoute(route) { return experienceTemplates.find((item) => item.route === route)?.type || null; }
export function newExperiencePath(type) { return `/experiences/new/${templateFor(type).route}`; }
export function wordCount(text) { return (text || "").trim().split(/\s+/u).filter(Boolean).length; }
export function entryExcerpt(entry) {
  return entry.summary || entry.story || entry.subtitle || entry.moments?.find((item) => item.body)?.body || "";
}

export function makeMoment(type, date, experience, title = "") {
  return { id: null, momentType: type, title, body: "", momentDate: date || null,
    dayNumber: experience.experienceType === "TRAVEL" ? dayNumber(experience.startDate, date) : null,
    placeName: "", location: "", rating: null, recommendation: null, cost: null, currency: experience.currency || "INR" };
}

// A day is a DAY moment in the existing API, not a second copy of the trip's story.
// Keep every legacy moment and ID. Only create a chapter once there is something to keep.
export function writeDay(experience, date, body) {
  if (date && dateNumber(date) == null) throw new Error("Choose a valid day.");
  if (date && experience.startDate && date < experience.startDate) throw new Error("This day is before the trip starts.");
  if (date && experience.endDate && date > experience.endDate) throw new Error("This day is after the trip ends. Adjust the trip dates first.");
  const moments = experience.moments || [];
  const index = moments.findIndex((item) => item.momentType === "DAY" && (item.momentDate || "") === (date || ""));
  if (index >= 0) return moments.map((item, i) => i === index ? { ...item, body } : item);
  if (!body.trim()) return moments;
  if (moments.length >= 100) throw new Error("This trip has reached its limit of 100 chapters and stops.");
  const number = dayNumber(experience.startDate, date);
  const title = number ? `Day ${number}` : date || "Undated notes";
  return [...moments, { ...makeMoment("DAY", date, experience, title), body }];
}

export function moveMomentWithinDay(moments, index, direction) {
  if (!moments[index]) return moments;
  const positions = moments.map((item, i) => (item.momentDate || "") === (moments[index].momentDate || "") ? i : -1).filter((i) => i >= 0);
  const target = positions[positions.indexOf(index) + direction];
  if (target == null) return moments;
  const next = [...moments];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
