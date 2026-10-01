import { apiRequest } from "./client";

export const diaryApi = {
  analyze(date) { return apiRequest(`/diary/analysis?${new URLSearchParams({ date })}`); },
  refreshAnalysis(date) { return apiRequest("/diary/analysis/refresh", { method: "POST", body: JSON.stringify({ date }) }); },
  list(start, end) {
    return apiRequest(`/diary?${new URLSearchParams({ start, end })}`);
  },
  save(entryDate, entry) {
    return apiRequest(`/diary/${encodeURIComponent(entryDate)}`, { method: "PUT", body: JSON.stringify(entry) });
  },
  remove(entryDate) {
    return apiRequest(`/diary/${encodeURIComponent(entryDate)}`, { method: "DELETE" });
  },
};
