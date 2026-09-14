import { useCallback, useEffect, useState } from "react";
import { experienceApi } from "../api/experiences";
import { experiencePayload } from "../lib/experiences";

export function useExperienceManager(user) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const result = await experienceApi.list();
      setExperiences(Array.isArray(result) ? result : []);
      setReady(true);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const merge = useCallback((item) => {
    setExperiences((current) => [item, ...current.filter((value) => value.id !== item.id)]
      .sort((left, right) => (right.updatedAt || "").localeCompare(left.updatedAt || "")));
    return item;
  }, []);

  const save = useCallback(async (value) => {
    const saved = value.id
      ? await experienceApi.update(value.id, experiencePayload(value))
      : await experienceApi.create(experiencePayload(value));
    return merge(saved);
  }, [merge]);

  const remove = useCallback(async (id) => {
    await experienceApi.remove(id);
    setExperiences((current) => current.filter((item) => item.id !== id));
  }, []);

  return { experiences, loading, ready, error, retry: load, actions: { save, remove, merge, reload: load } };
}
