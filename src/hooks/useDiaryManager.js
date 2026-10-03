import { useCallback, useEffect, useRef, useState } from "react";
import { diaryApi } from "../api/diary";
import { localDateKey, shiftDate } from "../lib/dates";
import { blankEntry, entryPayload } from "../lib/diary";

export function useDiaryManager(user = null) {
  const today = localDateKey();
  const entriesRef = useRef([]);
  const timers = useRef(new Map());
  const versions = useRef(new Map());
  const queues = useRef(new Map());
  const serverRevisions = useRef(new Map());
  const conflicts = useRef(new Set());
  const unsaved = useRef(new Set());
  const uid = user?.uid || null;
  const activeUser = useRef(uid);
  activeUser.current = uid;
  const requestSequence = useRef(0);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [saveStates, setSaveStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const replaceEntries = useCallback((next) => {
    const sorted = [...next].sort((left, right) => right.entryDate.localeCompare(left.entryDate));
    entriesRef.current = sorted;
    setEntries(sorted);
  }, []);

  const mergeEntry = useCallback((entry) => {
    const exists = entriesRef.current.some((item) => item.entryDate === entry.entryDate);
    replaceEntries(exists
      ? entriesRef.current.map((item) => item.entryDate === entry.entryDate ? entry : item)
      : [entry, ...entriesRef.current]);
  }, [replaceEntries]);

  const enqueue = useCallback((date, operation) => {
    const owner = uid;
    const previous = queues.current.get(date) || Promise.resolve();
    const queued = previous.catch(() => undefined).then(() => {
      if (!owner || activeUser.current !== owner) throw new Error("The signed-in account changed.");
      return operation();
    });
    queues.current.set(date, queued);
    const clean = () => { if (queues.current.get(date) === queued) queues.current.delete(date); };
    queued.then(clean, clean);
    return queued;
  }, [uid]);

  const persist = useCallback(async (entry, version) => {
    const owner = uid;
    try {
      const saved = await enqueue(entry.entryDate, async () => {
        if (conflicts.current.has(entry.entryDate)) throw new Error("This reflection changed elsewhere. Copy your draft before reloading.");
        const saved = await diaryApi.save(entry.entryDate, { ...entryPayload(entry), expectedUpdatedAt: serverRevisions.current.get(entry.entryDate) || entry.updatedAt || null });
        if (activeUser.current === uid) serverRevisions.current.set(entry.entryDate, saved.updatedAt);
        return saved;
      });
      if (activeUser.current !== owner) return saved;
      if (versions.current.get(entry.entryDate) === version) {
        unsaved.current.delete(entry.entryDate);
        mergeEntry(saved);
        setSaveStates((current) => ({ ...current, [entry.entryDate]: "Saved" }));
      }
      return saved;
    } catch (error) {
      if (activeUser.current !== uid) throw error;
      if (error.status === 409) conflicts.current.add(entry.entryDate);
      if (versions.current.get(entry.entryDate) === version) {
        setSaveStates((current) => ({ ...current, [entry.entryDate]: "Save failed" }));
      }
      throw error;
    }
  }, [enqueue, mergeEntry, uid]);

  const load = useCallback(async () => {
    if (!uid) return;
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await diaryApi.list(shiftDate(today, -1825), today);
      if (requestId !== requestSequence.current || activeUser.current !== uid) return;
      const loaded = Array.isArray(result) ? result : [];
      loaded.forEach(entry => { if (!(conflicts.current.has(entry.entryDate) || unsaved.current.has(entry.entryDate))) serverRevisions.current.set(entry.entryDate, entry.updatedAt); });
      replaceEntries(loaded.map(entry => (conflicts.current.has(entry.entryDate) || unsaved.current.has(entry.entryDate)) ? entriesRef.current.find(item => item.entryDate === entry.entryDate) || entry : entry).concat(entriesRef.current.filter(item => unsaved.current.has(item.entryDate) && !loaded.some(saved => saved.entryDate === item.entryDate))));
      setReady(true);
    } catch (error) {
      if (requestId === requestSequence.current && activeUser.current === uid) setLoadError(error.message);
    } finally {
      if (requestId === requestSequence.current && activeUser.current === uid) setLoading(false);
    }
  }, [replaceEntries, today, uid]);

  useEffect(() => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current.clear(); queues.current.clear(); versions.current.clear();
    serverRevisions.current.clear(); conflicts.current.clear(); unsaved.current.clear();
    replaceEntries([]);
    setSaveStates({});
    setReady(false);
    if (!user) {
      setEntries([]);
      setReady(false);
      setLoading(false);
      setLoadError("");
      return;
    }
    load();
    return () => {
      requestSequence.current += 1;
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [load, uid]);

  useEffect(() => {
    if (!user) return undefined;
    const sync = () => {
      if (document.visibilityState === "visible" && timers.current.size === 0 && queues.current.size === 0 && unsaved.current.size === 0) void load();
    };
    const timer = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [uid, load]);

  const updateEntry = useCallback((date, patch, onError) => {
    const current = entriesRef.current.find((entry) => entry.entryDate === date) || blankEntry(date);
    const next = { ...current, ...patch };
    unsaved.current.add(date);
    mergeEntry(next);
    const version = (versions.current.get(date) || 0) + 1;
    versions.current.set(date, version);
    setSaveStates((states) => ({ ...states, [date]: "Saving" }));
    window.clearTimeout(timers.current.get(date));
    timers.current.set(date, window.setTimeout(() => {
      timers.current.delete(date);
      persist(next, version).catch(onError);
    }, 700));
  }, [mergeEntry, persist]);

  const flushEntry = useCallback((date, onError) => {
    if (!timers.current.has(date) && !unsaved.current.has(date)) return;
    window.clearTimeout(timers.current.get(date));
    timers.current.delete(date);
    const entry = entriesRef.current.find((item) => item.entryDate === date);
    if (entry) persist(entry, versions.current.get(date)).catch(onError);
  }, [persist]);

  const selectDate = useCallback((date, onError) => {
    const safeDate = date > today ? today : date;
    if (selectedDate !== safeDate) flushEntry(selectedDate, onError);
    setSelectedDate(safeDate);
  }, [flushEntry, selectedDate, today]);

  const deleteEntry = useCallback(async (date) => {
    const owner = uid;
    setDeleting(true);
    window.clearTimeout(timers.current.get(date));
    timers.current.delete(date);
    versions.current.set(date, (versions.current.get(date) || 0) + 1);
    try {
      await (queues.current.get(date) || Promise.resolve()).catch(() => undefined);
      if (activeUser.current !== owner) return;
      await diaryApi.remove(date);
      if (activeUser.current !== owner) return;
      unsaved.current.delete(date); conflicts.current.delete(date); serverRevisions.current.delete(date);
      replaceEntries(entriesRef.current.filter((entry) => entry.entryDate !== date));
      setSaveStates((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
    } finally {
      setDeleting(false);
    }
  }, [replaceEntries, uid]);

  const currentEntry = entries.find((entry) => entry.entryDate === selectedDate) || blankEntry(selectedDate);
  return {
    today,
    entries,
    selectedDate,
    currentEntry,
    saveState: saveStates[selectedDate] || (currentEntry.id ? "Saved" : "Not saved yet"),
    loading,
    ready,
    loadError,
    deleting,
    retry: load,
    actions: { updateEntry, flushEntry, selectDate, deleteEntry },
  };
}
