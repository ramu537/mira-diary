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
    const previous = queues.current.get(date) || Promise.resolve();
    const queued = previous.catch(() => undefined).then(operation);
    queues.current.set(date, queued);
    const clean = () => { if (queues.current.get(date) === queued) queues.current.delete(date); };
    queued.then(clean, clean);
    return queued;
  }, []);

  const persist = useCallback(async (entry, version) => {
    try {
      const saved = await enqueue(entry.entryDate, () => diaryApi.save(entry.entryDate, entryPayload(entry)));
      if (versions.current.get(entry.entryDate) === version) {
        mergeEntry(saved);
        setSaveStates((current) => ({ ...current, [entry.entryDate]: "Saved" }));
      }
      return saved;
    } catch (error) {
      if (versions.current.get(entry.entryDate) === version) {
        setSaveStates((current) => ({ ...current, [entry.entryDate]: "Save failed" }));
      }
      throw error;
    }
  }, [enqueue, mergeEntry]);

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await diaryApi.list(shiftDate(today, -1825), today);
      if (requestId !== requestSequence.current) return;
      replaceEntries(Array.isArray(result) ? result : []);
      setReady(true);
    } catch (error) {
      if (requestId === requestSequence.current) setLoadError(error.message);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [replaceEntries, today]);

  useEffect(() => {
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
  }, [load, user]);

  const updateEntry = useCallback((date, patch, onError) => {
    const current = entriesRef.current.find((entry) => entry.entryDate === date) || blankEntry(date);
    const next = { ...current, ...patch };
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
    if (!timers.current.has(date)) return;
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
    setDeleting(true);
    window.clearTimeout(timers.current.get(date));
    timers.current.delete(date);
    versions.current.set(date, (versions.current.get(date) || 0) + 1);
    try {
      await (queues.current.get(date) || Promise.resolve()).catch(() => undefined);
      await diaryApi.remove(date);
      replaceEntries(entriesRef.current.filter((entry) => entry.entryDate !== date));
      setSaveStates((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
    } finally {
      setDeleting(false);
    }
  }, [replaceEntries]);

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
