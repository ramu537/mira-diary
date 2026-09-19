import { apiRequest } from "./client";

function params(filters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export const experienceApi = {
  list: (filters) => apiRequest(`/experiences${params(filters)}`),
  get: (id) => apiRequest(`/experiences/${id}`),
  create: (body) => apiRequest("/experiences", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/experiences/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/experiences/${id}`, { method: "DELETE" }),
  uploadMedia: (id, file, fields = {}) => {
    const form = new FormData();
    form.append("file", file);
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return apiRequest(`/experiences/${id}/media`, { method: "POST", body: form });
  },
  updateMedia: (id, mediaId, body) => apiRequest(`/experiences/${id}/media/${mediaId}`, { method: "PUT", body: JSON.stringify(body) }),
  removeMedia: (id, mediaId) => apiRequest(`/experiences/${id}/media/${mediaId}`, { method: "DELETE" }),
  setCover: (id, mediaId) => apiRequest(`/experiences/${id}/cover/${mediaId}`, { method: "PUT" }),
  publication: (id) => apiRequest(`/experiences/${id}/publication`),
  preview: (id, body) => apiRequest(`/experiences/${id}/publication/preview`, { method: "POST", body: JSON.stringify(body) }),
  publish: (id, body) => apiRequest(`/experiences/${id}/publication`, { method: "PUT", body: JSON.stringify(body) }),
  unpublish: (id) => apiRequest(`/experiences/${id}/publication`, { method: "DELETE" }),
};

export const publicExperienceApi = {
  list: (limit = 12) => apiRequest(`/public/experiences?limit=${limit}`),
  get: (slug) => apiRequest(`/public/experiences/${encodeURIComponent(slug)}`),
};
