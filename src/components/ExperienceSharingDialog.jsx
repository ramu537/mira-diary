import { ArrowLeft, Check, Copy, ExternalLink, Globe2, Link2, LockKeyhole, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { experienceApi } from "../api/experiences";
import { safeSharingOptions, sharingPayload } from "../lib/tripJournal";
import ExperienceImage from "./ExperienceImage";
import ExperienceStory from "./ExperienceStory";

export default function ExperienceSharingDialog({ experience, onClose, onPublished, onNotice, onBusyChange }) {
  const dialog = useRef(null), request = useRef(0), mounted = useRef(false), lock = useRef(false);
  const [options, setOptions] = useState(null), [preview, setPreview] = useState(null), [publication, setPublication] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0), [stage, setStage] = useState("settings");
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    const active = document.activeElement;
    if (!dialog.current.open) dialog.current.showModal();
    return () => { mounted.current = false; request.current += 1; if (active instanceof HTMLElement) active.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    request.current += 1;
    setError(""); setOptions(null); setPreview(null);
    (async () => {
      try {
        const previous = experience.publishedSlug ? await experienceApi.publication(experience.id) : null;
        if (active) { setPublication(previous); setOptions(safeSharingOptions(experience, previous)); }
      } catch (failure) { if (active) setError(failure.message); }
    })();
    return () => { active = false; };
  }, [experience.id, experience.publishedSlug, experience.version, loadAttempt]);
  const change = (patch) => {
    request.current += 1; setOptions((value) => ({ ...value, ...patch })); setPreview(null); setStage("settings"); setError("");
  };
  const payload = () => ({ ...sharingPayload(options, experience), sourceVersion: experience.version });
  async function prepare() {
    if (lock.current || !options) return;
    lock.current = true;
    const sequence = ++request.current;
    setBusy(true); setError("");
    try {
      const next = await experienceApi.preview(experience.id, payload());
      if (mounted.current && sequence === request.current) { setPreview(next); setStage("review"); }
    } catch (failure) { if (mounted.current && sequence === request.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function publish() {
    if (!preview || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const next = await experienceApi.publish(experience.id, payload());
      if (!mounted.current) return;
      setPublication(next); setPreview(null); setStage("published"); setCopied(false);
      onNotice("Shared story updated. Further writing stays private until you publish again.");
      try { await onPublished(); } catch { setError("Published successfully. Reopen the entry before making further changes."); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function unpublish() {
    if (lock.current || !window.confirm("Make this story private? The shared link will stop working. Downloaded copies cannot be recalled.")) return;
    lock.current = true; setBusy(true); setError("");
    try {
      await experienceApi.unpublish(experience.id);
      if (!mounted.current) return;
      setPublication(null); setPreview(null); setStage("settings");
      onNotice("Your shared link is revoked. The entry is private.");
      try { await onPublished(); onClose(); } catch { setError("Made private successfully. Reopen the entry to refresh its status."); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function copy() {
    const url = `${window.location.origin}/shared/${publication.slug}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { window.prompt("Copy story link", url); }
  }
  const visiblePreview = preview || (stage === "published" ? publication?.snapshot : null);
  return <dialog className={`publication-studio studio-stage--${stage}`} ref={dialog} aria-labelledby="sharing-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="studio-header"><div><span className="writer-kicker">Reader edition</span><h2 id="sharing-title">Share your story</h2></div>
      <span className="studio-header-status"><LockKeyhole size={14} />Your working copy stays private</span>
      <button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label="Close sharing"><X size={21} /></button></header>
    {error && <div className="journal-error studio-error" role="alert"><p>{error}</p>{!options && <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button>}</div>}
    <div className="studio-layout">
      <aside className="studio-settings">
        {!options ? <p role="status">{error ? "Sharing is paused until your choices can be loaded." : "Loading your sharing choices…"}</p> : <>
          <fieldset disabled={busy}><legend>Who can read it?</legend>
            <div className="studio-audiences">{[["UNLISTED", "Anyone with the link", "Not listed in Explore", Link2], ["PUBLIC", "Public", "Also appears in Explore", Globe2]].map(([value, label, hint, Icon]) => <label key={value}>
              <input type="radio" name="story-audience" value={value} checked={options.visibility === value} onChange={() => change({ visibility: value })} />
              <Icon size={19} /><span><strong>{label}</strong><small>{hint}</small></span>
            </label>)}</div>
            <h3>What to include</h3>
            <div className="studio-inclusions">{[["includeLocation", "Places & venues"], ["includeCompanions", "People you were with"], ["includeCosts", "Costs"], ["includeMedia", "Selected photos"]].map(([key, label]) => <label key={key}>
              <input type="checkbox" checked={options[key]} onChange={(event) => change({ [key]: event.target.checked })} />{label}</label>)}</div>
            {!!experience.moments.length && <details className="studio-selection"><summary>Chapters, stops & notes <span>{experience.moments.length - options.excludedMomentIds.length}/{experience.moments.length}</span></summary>
              {experience.moments.map((moment) => <label key={moment.id}><input type="checkbox" checked={!options.excludedMomentIds.includes(moment.id)}
                onChange={(event) => change({ excludedMomentIds: event.target.checked ? options.excludedMomentIds.filter((id) => id !== moment.id) : [...options.excludedMomentIds, moment.id] })} /><span>{moment.title}</span></label>)}
              <small>Hidden entries and their attached photos are excluded together.</small>
            </details>}
            {options.includeMedia && <details className="studio-selection" open><summary>Choose photos <span>{sharingPayload(options, experience).includedMediaIds.length}/{experience.media.length}</span></summary>
              {!!experience.media.length && <div className="studio-photo-shortcuts"><button type="button" className="writer-text-button" onClick={() => change({ includedMediaIds: experience.media.filter((image) => !image.momentId || !options.excludedMomentIds.includes(image.momentId)).map((image) => image.id) })}>Select eligible photos</button><button type="button" className="writer-text-button" onClick={() => change({ includedMediaIds: [] })}>Clear</button></div>}
              <div className="studio-photo-picker">{experience.media.map((image) => {
                const excluded = image.momentId && options.excludedMomentIds.includes(image.momentId);
                return <label key={image.id}><ExperienceImage experienceId={experience.id} media={image} /><span>
                  <input type="checkbox" disabled={Boolean(excluded)} checked={!excluded && options.includedMediaIds.includes(image.id)}
                    onChange={(event) => change({ includedMediaIds: event.target.checked ? [...options.includedMediaIds, image.id] : options.includedMediaIds.filter((id) => id !== image.id) })} />
                  {excluded ? "Entry hidden" : image.caption || "Include"}
                </span></label>;
              })}</div>{!experience.media.length && <p>No photos added yet.</p>}
            </details>}
          </fieldset>
          <p className="studio-privacy-note">Names, locations or costs written in your story or captions won’t be removed by these switches. Read the preview before publishing.</p>
          <button type="button" className="button button--primary studio-review-button" disabled={busy} onClick={prepare}>{busy ? "Working…" : "Review story"}</button>
          {publication ? <section className="studio-live-link"><span><Check size={14} />{publication.visibility === "PUBLIC" ? "Public story is live" : "Link-only story is live"}</span>
            <button type="button" className="writer-text-button" onClick={copy}><Copy size={15} />{copied ? "Copied" : "Copy link"}</button>
            <a className="writer-text-button" href={`/shared/${publication.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Open story</a>
            <button type="button" className="writer-text-button" disabled={busy} onClick={unpublish}><LockKeyhole size={15} />Make private</button>
          </section> : <p className="studio-not-published"><LockKeyhole size={14} />Not shared yet</p>}
        </>}
      </aside>
      <section className="studio-reader" aria-label="Shared story preview">
        <div className="studio-reader-bar"><button type="button" className="writer-text-button studio-back" disabled={busy} onClick={() => setStage("settings")}><ArrowLeft size={16} />Sharing choices</button>
          <span>{stage === "published" ? "Published edition" : "Reader preview"}</span>{visiblePreview && <small>{visiblePreview.visibility === "PUBLIC" ? "Public" : "Link-only"}</small>}</div>
        {visiblePreview ? <ExperienceStory story={visiblePreview} experienceId={experience.id} /> : <div className="studio-preview-empty"><span className="writer-kicker">Before it leaves your journal</span><h3>Read it as they will.</h3><p>Choose the parts you want to include, then select “Review story”. Nothing is shared until you publish.</p></div>}
      </section>
    </div>
    <footer className="studio-footer"><p>{preview ? "This preview uses your sharing choices. Public photos have embedded metadata removed." : "Links can be forwarded. Copies already downloaded cannot be recalled."}</p>
      {stage === "published" && publication && <button type="button" className="button button--ghost" onClick={copy}><Copy size={15} />{copied ? "Copied" : "Copy link"}</button>}
      <button type="button" className="button button--ghost" disabled={busy} onClick={onClose}>{publication ? "Done" : "Keep private"}</button>
      {preview && <button type="button" className="button button--primary" disabled={busy} onClick={publish}>{busy ? "Publishing…" : publication ? "Update shared story" : options.visibility === "PUBLIC" ? "Publish publicly" : "Create share link"}</button>}
    </footer>
  </dialog>;
}
