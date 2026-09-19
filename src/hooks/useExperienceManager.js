import { useCallback, useEffect, useRef, useState } from "react";
import { experienceApi } from "../api/experiences";
import { experiencePayload } from "../lib/experiences";

export function useExperienceManager(user) {
  const uid = user?.uid || null;
  const activeUser = useRef(uid);
  activeUser.current = uid;
  const sequence = useRef(0);
  const [state, setState] = useState({ owner: null, experiences: [], ready: false, loading: false, error: "" });
  const load = useCallback(async () => {
    if (!uid) return;
    const request = ++sequence.current;
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await experienceApi.list();
      if (request !== sequence.current || activeUser.current !== uid) return;
      setState({ owner: uid, experiences: Array.isArray(result) ? result : [], ready: true, loading: false, error: "" });
    } catch (error) {
      if (request === sequence.current && activeUser.current === uid) setState((current) => ({ ...current, owner: uid, loading: false, error: error.message }));
    }
  }, [uid]);
  useEffect(() => {
    setState({ owner: uid, experiences: [], ready: false, loading: Boolean(uid), error: "" });
    void load();
    return () => { sequence.current += 1; };
  }, [uid, load]);
  const merge = useCallback((item) => {
    if (activeUser.current !== uid) return item;
    sequence.current += 1;
    setState((current) => ({ ...current, owner: uid, loading: false, experiences:
      [item, ...(current.owner === uid ? current.experiences : []).filter((value) => value.id !== item.id)]
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")) }));
    return item;
  }, [uid]);
  const save = useCallback(async (value) => {
    if (!uid || activeUser.current !== uid) throw new Error("Sign in again before saving.");
    const saved = value.id
      ? await experienceApi.update(value.id, experiencePayload(value))
      : await experienceApi.create(experiencePayload(value));
    return merge(saved);
  }, [uid, merge]);

  const remove = useCallback(async (id) => {
    await experienceApi.remove(id);
    if (activeUser.current !== uid) return;
    sequence.current += 1;
    setState((current) => ({ ...current, loading: false, experiences: current.experiences.filter((item) => item.id !== id) }));
  }, [uid]);
  const current = state.owner === uid ? state : { experiences: [], ready: false, loading: Boolean(uid), error: "" };
  return { ...current, userId: uid, retry: load, actions: { save, remove, merge, reload: load } };
}
