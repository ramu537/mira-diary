import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { experienceApi } from "../api/experiences";
import { blankExperience, experiencePayload } from "../lib/experiences";

const metadata = (item) => ({ momentId: item.momentId || null, caption: item.caption || "", altText: item.altText || "", sortOrder: item.sortOrder || 0 });
const fingerprint = (item) => JSON.stringify({ ...experiencePayload(item), version: null, media: (item.media || []).map((image) => ({ id: image.id, ...metadata(image) })) });

export function useExperienceEditor(id, initialType, manager, onNotice) {
  const [draft, setDraft] = useState(() => blankExperience(initialType));
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [uncertainCreate, setUncertainCreate] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [pendingCapture, setPendingCapture] = useState(false);
  const live = useRef(false), lock = useRef(false), value = useRef(draft), baseline = useRef(saved);
  const exitAllowed = useRef(false);
  value.current = draft; baseline.current = saved;
  const dirty = saved ? fingerprint(draft) !== fingerprint(saved) : fingerprint(draft) !== fingerprint(blankExperience(initialType));
  const needsGuard = dirty || pendingCapture || busy || uploads.some((item) => item.status !== "done");
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !exitAllowed.current && needsGuard
    && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));

  function replace(next) { value.current = next; setDraft(next); }
  function adopt(next) {
    if (!live.current) return;
    replace(next); baseline.current = next; setSaved(next); manager.actions.merge(next); setConflict(false);
  }
  useEffect(() => {
    let active = true;
    live.current = true;
    if (id) {
      experienceApi.get(id).then((next) => { if (active) adopt(next); })
        .catch((failure) => { if (active) setError(failure.message); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; live.current = false; };
  }, []); // The editor is keyed by owner and route; responses never reach a different account/trip.

  useEffect(() => {
    const guard = (event) => { if (!exitAllowed.current && needsGuard) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [needsGuard]);

  async function run(operation) {
    if (lock.current || !live.current) return null;
    lock.current = true; setBusy(true); setError("");
    try { return await operation(); }
    catch (failure) {
      if (live.current) {
        setConflict(failure.status === 409);
        setError(failure.status === 409 ? "This experience changed elsewhere. Your draft is still here. Copy it before reloading the saved version." : failure.message);
      }
      return null;
    } finally { lock.current = false; if (live.current) setBusy(false); }
  }

  async function persist(next = value.current) {
    if (uncertainCreate) throw new Error("The earlier save may have succeeded. Check your library before creating another copy.");
    if (!next.title.trim()) throw new Error("Give this experience a name first. Everything else can wait.");
    const desiredMedia = next.media || [];
    let result;
    try { result = await manager.actions.save(next); }
    catch (failure) {
      if (!next.id && (!failure.status || failure.status >= 500)) { setUncertainCreate(true); throw new Error("Could not confirm the new experience was saved. Your draft is kept here; check the library before trying again."); }
      throw failure;
    }
    if (!live.current) return result;
    // Keep the canonical ID/version even if a later metadata write fails.
    replace({ ...result, media: desiredMedia }); baseline.current = result; setSaved(result);
    try {
      let changedMedia = false;
      for (const image of desiredMedia) {
        const prior = result.media.find((item) => item.id === image.id);
        if (prior && JSON.stringify(metadata(prior)) !== JSON.stringify(metadata(image))) {
          await experienceApi.updateMedia(result.id, image.id, metadata(image));
          changedMedia = true;
        }
      }
      if (changedMedia) result = await experienceApi.get(result.id);
    } catch (failure) {
      failure.savedExperience = result;
      // A metadata update may have incremented the version. Keep edits, but recover the new version if possible.
      try {
        const latest = await experienceApi.get(result.id);
        const core = (item) => JSON.stringify({ ...experiencePayload(item), version: null });
        if (live.current && core(latest) === core(result)) {
          replace({ ...value.current, version: latest.version }); baseline.current = latest; setSaved(latest);
        } else if (live.current) { failure.status = 409; }
      } catch { /* Keep the draft; an explicit reload remains available. */ }
      throw failure;
    }
    adopt(result);
    return result;
  }

  async function refresh() {
    const next = await experienceApi.get(value.current.id || id);
    adopt(next); return next;
  }

  async function uploadItems(items, target) {
    for (const item of items) {
      if (!live.current) return;
      setUploads((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: "uploading", error: "" } : entry));
      try {
        const image = await experienceApi.uploadMedia(target.id, item.file, { momentId: item.momentId, sortOrder: item.sortOrder, uploadId: item.key });
        if (!live.current) return;
        const next = { ...value.current, media: [...value.current.media.filter((entry) => entry.id !== image.id), image] };
        replace(next);
        setUploads((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: "done", file: null } : entry));
      } catch (failure) {
        if (live.current) setUploads((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: "failed", error: failure.message } : entry));
      }
    }
    if (live.current) {
      try { await refresh(); }
      catch { setError("Uploads finished, but the latest version could not be loaded. Your photos and text are kept here. Reload before further edits."); setConflict(true); }
    }
  }

  const change = (patch) => { if (!lock.current) replace({ ...value.current, ...patch }); };
  const save = () => run(async () => { const next = await persist(); if (live.current) onNotice(next.publishedSlug ? "Private working copy saved. Your shared snapshot is unchanged." : "Experience saved privately."); return next; });
  const capture = (moments, files = [], existingMomentId = null) => run(async () => {
    // Finish existing edits first. A failed metadata save must not make retrying a new moment duplicate it.
    const before = value.current.id && dirty ? await persist() : value.current;
    if (files.length + before.media.length > 30) throw new Error(`You can add ${Math.max(0, 30 - before.media.length)} more photos to this experience.`);
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: choose a JPEG, PNG or WebP up to 5 MB.`);
    }
    // Allocate retry keys before writing the moment, so client-side failures cannot strand a saved capture.
    const queuedFiles = files.map((file) => ({ key: crypto.randomUUID(), file, name: file.name, status: "waiting" }));
    const next = { ...before, moments: [...before.moments, ...moments] };
    const result = await persist(next);
    if (!live.current) return result;
    const momentId = existingMomentId || (moments.length ? result.moments[before.moments.length]?.id : null);
    const items = queuedFiles.map((item, index) => ({ ...item, momentId, sortOrder: result.media.length + index }));
    setUploads((current) => [...current.filter((item) => item.status !== "done"), ...items]);
    if (items.length) await uploadItems(items, result);
    if (live.current) onNotice(moments.length ? "Memory saved. You can add more detail any time." : "Photo upload finished. Check below for any retries.");
    return result;
  });
  const retryUpload = (item) => run(async () => {
    // Retry the same upload ID. The backend returns the original result if the first attempt reached it.
    if (dirty) await persist();
    await uploadItems([item], value.current);
  });
  const mediaAction = (action) => run(async () => { if (dirty) await persist(); await action(value.current.id); await refresh(); });
  const reload = () => run(async () => {
    if ((dirty || uncertainCreate) && !window.confirm("Replace this draft with the saved version? Copy any unsaved text first.")) return;
    await refresh(); setError("");
  });
  return { draft, saved, dirty, pendingCapture, setPendingCapture, loading, busy, error, conflict, uncertainCreate, uploads, change, save, capture, retryUpload,
    blocker, allowExit: () => { exitAllowed.current = true; },
    dismissUpload: (key) => setUploads((items) => items.filter((item) => item.key !== key)),
    mediaAction, reload, refresh, run, persist };
}
