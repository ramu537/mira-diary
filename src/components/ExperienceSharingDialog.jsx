import { Check, Copy, Globe2, Link2, LockKeyhole, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { experienceApi } from "../api/experiences";
import { safeSharingOptions, sharingPayload } from "../lib/tripJournal";
import ExperienceImage from "./ExperienceImage";
import ExperienceStory from "./ExperienceStory";

export default function ExperienceSharingDialog({ experience, onClose, onPublished, onNotice }) {
  const dialog = useRef(null);
  const [options, setOptions] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [publication, setPublication] = useState(null);
  const request = useRef(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const active = document.activeElement;
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    return () => { mounted.current = false; request.current += 1; if (active instanceof HTMLElement) active.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    setError(""); setOptions(null); setPreview(null);
    (async () => {
      try {
        const previous = experience.publishedSlug ? await experienceApi.publication(experience.id) : null;
        if (active) { setPublication(previous); setOptions(safeSharingOptions(experience, previous)); }
      } catch (failure) { if (active) setError(failure.message); }
    })();
    return () => { active = false; };
  }, [experience.id, experience.publishedSlug, experience.version, loadAttempt]);
  const change = (patch) => { request.current += 1; setOptions((value) => ({ ...value, ...patch })); setPreview(null); setError(""); };
  const payload = () => ({ ...sharingPayload(options, experience), sourceVersion: experience.version });
  async function prepare() {
    const sequence = ++request.current;
    setBusy(true); setError("");
    try { const value = await experienceApi.preview(experience.id, payload()); if (sequence === request.current) setPreview(value); }
    catch (failure) { if (sequence === request.current) setError(failure.message); }
    finally { if (sequence === request.current) setBusy(false); }
  }
  async function publish() {
    if (!preview || busy) return;
    setBusy(true); setError("");
    try {
      const value = await experienceApi.publish(experience.id, payload());
      if (!mounted.current) return;
      setPublication(value); setPreview(null);
      onNotice("Shared snapshot saved. Private edits stay private until you share again.");
      try { await onPublished(); } catch { setError("Your story was shared. Close and reopen it to refresh the private draft before editing."); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function unpublish() {
    if (!window.confirm("Make this experience private? Its link will stop working. Downloaded copies cannot be recalled.")) return;
    setBusy(true); setError("");
    try {
      await experienceApi.unpublish(experience.id);
      if (!mounted.current) return;
      setPublication(null); setPreview(null);
      onNotice("The shared link is revoked. This experience is private.");
      try { await onPublished(); onClose(); } catch { setError("Unpublished successfully. Reload this experience to refresh its status."); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function copy() {
    const url = `${window.location.origin}/shared/${publication.slug}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { window.prompt("Copy story link", url); }
  }
  return <dialog className="sharing-dialog" ref={dialog} aria-labelledby="sharing-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><div><span className="eyebrow">You choose what leaves your diary</span><h2 id="sharing-title">Share this experience</h2></div><button className="icon-button" type="button" disabled={busy} onClick={onClose} aria-label="Close sharing"><X size={20} /></button></header>
    <p>Publish a snapshot, not your live draft. Review the words and photo captions too: hiding a field cannot remove details written in your story.</p>
    {error && <p className="journal-error" role="alert">{error}{!options && <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button>}</p>}
    {!options ? <p role="status">{error ? "Sharing is paused until your previous choices can be loaded." : "Loading sharing choices…"}</p> : <>
      <fieldset disabled={busy}><legend className="sr-only">Sharing choices</legend>
        <div className="sharing-levels"><div><LockKeyhole size={20} /><strong>Private draft</strong><small>Always kept separately</small></div>{[["UNLISTED", "Link-only", "Anyone with the link", Link2], ["PUBLIC", "Public", "Visible in Explore", Globe2]].map(([value, label, hint, Icon]) => <button type="button" key={value} className={options.visibility === value ? "is-selected" : ""} aria-pressed={options.visibility === value} onClick={() => change({ visibility: value })}><Icon size={20} /><strong>{label}</strong><small>{hint}</small></button>)}</div>
        <div className="sharing-checks">{[["includeLocation", "Places & venue"], ["includeCompanions", "Companions"], ["includeCosts", "Costs"], ["includeMedia", "Selected photos"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={(event) => change({ [key]: event.target.checked })} />{label}</label>)}</div>
        {!!experience.moments.length && <details className="share-selection"><summary>Choose moments</summary>{experience.moments.map((moment) => <label key={moment.id}><input type="checkbox" checked={!options.excludedMomentIds.includes(moment.id)} onChange={(event) => change({ excludedMomentIds: event.target.checked ? options.excludedMomentIds.filter((id) => id !== moment.id) : [...options.excludedMomentIds, moment.id] })} />{moment.title}</label>)}<p>Excluded moments and their attached photos stay out of this snapshot.</p></details>}
        {options.includeMedia && <div className="sharing-photo-picker">{experience.media.map((item) => {
          const hidden = item.momentId && options.excludedMomentIds.includes(item.momentId);
          return <label key={item.id}><ExperienceImage experienceId={experience.id} media={item} /><span><input type="checkbox" disabled={Boolean(hidden)} checked={!hidden && options.includedMediaIds.includes(item.id)} onChange={(event) => change({ includedMediaIds: event.target.checked ? [...options.includedMediaIds, item.id] : options.includedMediaIds.filter((id) => id !== item.id) })} />{hidden ? "Moment excluded" : item.caption || "Include photo"}</span></label>;
        })}{!experience.media.length && <p>No photos added yet.</p>}</div>}
      </fieldset>
      {preview && <section className="sharing-reader-preview"><h3>What readers will see</h3><p>Photo metadata is removed when served publicly. Your original photos stay private.</p><ExperienceStory story={preview} experienceId={experience.id} /></section>}
      {publication && <div className="sharing-live-link"><span>Live: {publication.visibility === "PUBLIC" ? "Public" : "Link-only"}</span><button className="button button--secondary" type="button" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</button><button className="button button--ghost" type="button" disabled={busy} onClick={unpublish}>Make private</button></div>}
      <footer><small>Links can be forwarded. Copies already downloaded cannot be recalled.</small><button className="button button--primary" type="button" disabled={busy} onClick={preview ? publish : prepare}>{busy ? "Working…" : preview ? publication ? "Update shared snapshot" : "Publish this snapshot" : "Preview shared story"}</button></footer>
    </>}
  </dialog>;
}
