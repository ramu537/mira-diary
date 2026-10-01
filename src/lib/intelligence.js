export function normalizeEvidence(evidence) {
  if (Array.isArray(evidence)) return evidence.map((item, index) => item && typeof item === "object"
    ? { key: item.key || item.code || String(index), label: item.label || item.name || item.key || `Evidence ${index + 1}`, value: item.value ?? item.detail ?? item.summary ?? "Recorded" }
    : { key: String(index), label: `Evidence ${index + 1}`, value: item });
  if (evidence && typeof evidence === "object") return Object.entries(evidence).map(([key, value]) => ({ key, label: key.replaceAll("_", " "), value }));
  return [];
}

export function intelligenceCopy(data) { return data?.assistantInterpretation || data?.interpretation || data?.summary || data?.guidance || ""; }
export function freshnessLabel(value) {
  if (!value) return "Current records";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Current records" : `Updated ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}
