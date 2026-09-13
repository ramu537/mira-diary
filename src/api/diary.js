import { apiRequest } from "./client";

export const diaryApi = {
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

