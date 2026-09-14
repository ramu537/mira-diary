import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, Check, ChevronDown, Copy, Globe2, ImagePlus, LockKeyhole, MapPin, Plus, Save, Star, Trash2, Unlink, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { experienceApi } from "../api/experiences";
import ExperienceImage from "../components/ExperienceImage";
import TagEditor from "../components/TagEditor";
import { blankExperience, blankMoment, experienceTypes, momentTypes, recommendations, sanitizeExperienceTags, typeDetails } from "../lib/experiences";

function Rating({ value, onChange, label = "Rating" }) {
  return <fieldset className="experience-rating"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number} aria-label={`${number} stars`} aria-pressed={value === number} onClick={() => onChange(value === number ? null : number)}><Star size={19} fill={number <= (value || 0) ? "currentColor" : "none"} /></button>)}</div></fieldset>;
}

function Field({ label, children, hint, className = "" }) {
  return <label className={`experience-field ${className}`}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

function PublishPanel({ experience, busy, onClose, onPublish, onUnpublish }) {
  const [options, setOptions] = useState(() => ({ visibility: experience.visibility === "PUBLIC" ? "PUBLIC" : "UNLISTED", includeLocation: true, includeCompanions: false, includeCosts: false, includeMedia: true, excludedMomentIds: [], includedMediaIds: (experience.media || []).map((item) => item.id) }));
  const [copied, setCopied] = useState(false);
  const shareUrl = experience.publishedSlug ? `${window.location.origin}/shared/${experience.publishedSlug}` : "";
  const update = (patch) => setOptions((value) => ({ ...value, ...patch }));
  async function copyLink() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl);
      else window.prompt("Copy this private link", shareUrl);
    } catch { window.prompt("Copy this private link", shareUrl); }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  return <div className="publish-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="publish-panel" role="dialog" aria-modal="true" aria-labelledby="publish-title">
    <header><div><span className="eyebrow">Share a deliberate snapshot</span><h2 id="publish-title">Publish this experience</h2><p>Only the details selected here enter the shared copy. Future private edits stay private until you publish again.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close sharing"><X size={19} /></button></header>
    <div className="visibility-options"><button className={options.visibility === "UNLISTED" ? "is-selected" : ""} type="button" onClick={() => update({ visibility: "UNLISTED" })}><LockKeyhole size={19} /><span><strong>Anyone with the link</strong><small>Hidden from public discovery</small></span><i /></button><button className={options.visibility === "PUBLIC" ? "is-selected" : ""} type="button" onClick={() => update({ visibility: "PUBLIC" })}><Globe2 size={19} /><span><strong>Public</strong><small>May appear in Mira Stories</small></span><i /></button></div>
    <div className="share-controls"><span>Include in shared copy</span>{[["includeLocation", "Places & venue", MapPin], ["includeCompanions", "Companions", Users], ["includeCosts", "Costs", null], ["includeMedia", "Selected photos", ImagePlus]].map(([key, label, Icon]) => <label key={key}><span>{Icon && <Icon size={15} />}{label}</span><input type="checkbox" checked={options[key]} onChange={(event) => update({ [key]: event.target.checked })} /></label>)}</div>
    {!!experience.moments?.length && <details className="share-selection"><summary>Choose moments <ChevronDown size={16} /></summary><div>{experience.moments.map((moment) => { const included = !options.excludedMomentIds.includes(moment.id); return <label key={moment.id}><input type="checkbox" checked={included} onChange={() => update({ excludedMomentIds: included ? [...options.excludedMomentIds, moment.id] : options.excludedMomentIds.filter((id) => id !== moment.id) })} /><span>{moment.title}</span></label>; })}</div></details>}
    {options.includeMedia && !!experience.media?.length && <details className="share-selection"><summary>Choose photos <ChevronDown size={16} /></summary><div className="share-photo-grid">{experience.media.map((media) => { const included = options.includedMediaIds.includes(media.id); return <label key={media.id}><ExperienceImage experienceId={experience.id} media={media} /><input type="checkbox" checked={included} onChange={() => update({ includedMediaIds: included ? options.includedMediaIds.filter((id) => id !== media.id) : [...options.includedMediaIds, media.id] })} /><span>{included && <Check size={15} />}</span></label>; })}</div></details>}
    {shareUrl && <div className="share-link"><span>{shareUrl}</span><button type="button" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}</button></div>}
    <footer>{experience.publishedSlug && <button className="button button--danger-quiet" type="button" onClick={onUnpublish} disabled={busy}><Unlink size={16} />Unpublish</button>}<span /><button className="button button--ghost" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="button" disabled={busy} onClick={() => onPublish(options)}>{busy ? "Publishing…" : experience.publishedSlug ? "Update shared copy" : "Publish story"}</button></footer>
  </section></div>;
}

export default function ExperienceEditorPage({ manager, onNotice }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initialType = experienceTypes.some((item) => item.value === searchParams.get("type")) ? searchParams.get("type") : "TRAVEL";
  const [draft, setDraft] = useState(() => blankExperience(initialType));
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const details = typeDetails(draft.experienceType);

  useEffect(() => {
    if (!id) { setDraft(blankExperience(initialType)); setLoading(false); setDirty(false); return; }
    const cached = manager.experiences.find((item) => String(item.id) === id);
    if (cached) { setDraft(cached); setLoading(false); setDirty(false); return; }
    setLoading(true);
    experienceApi.get(id).then((item) => { setDraft(item); manager.actions.merge(item); setDirty(false); })
      .catch((error) => onNotice(error, "error")).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const guard = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const change = (patch) => { setDraft((value) => ({ ...value, ...patch })); setDirty(true); };
  const updateMoment = (index, patch) => change({ moments: draft.moments.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  const changeType = (experienceType) => {
    if (experienceType === draft.experienceType) return;
    if (experienceType === "TRAVEL") change({ experienceType, startDate: draft.occurredOn || draft.startDate, endDate: draft.occurredOn || draft.endDate || draft.startDate, occurredOn: null });
    else change({ experienceType, occurredOn: draft.occurredOn || draft.startDate, startDate: null, endDate: null,
      moments: draft.moments.map((item) => ({ ...item, dayNumber: null })) });
  };
  const typeMoment = { TRAVEL: "DAY", MOVIE: "MOVIE", FOOD: "FOOD", ACTIVITY: "ACTIVITY", GENERAL: "MEMORY" }[draft.experienceType];

  async function save() {
    if (!draft.title.trim()) { onNotice(new Error("Give this experience a title before saving."), "error"); return null; }
    setBusy(true);
    try {
      const saved = await manager.actions.save(draft);
      setDraft(saved); setDirty(false); onNotice("Experience saved.", "success");
      if (!id) navigate(`/experiences/${saved.id}`, { replace: true });
      return saved;
    } catch (error) { onNotice(error, "error"); return null; }
    finally { setBusy(false); }
  }

  async function upload(files) {
    if (!files?.length) return;
    let target = draft.id ? draft : await save();
    if (!target) return;
    setBusy(true);
    try {
      const remaining = Math.max(0, 30 - (target.media?.length || 0));
      for (const file of [...files].slice(0, remaining)) await experienceApi.uploadMedia(target.id, file, { sortOrder: target.media?.length || 0 });
      target = await experienceApi.get(target.id); setDraft(target); manager.actions.merge(target); onNotice("Photos added.", "success");
    } catch (error) { onNotice(error, "error"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function removeMedia(mediaId) {
    setBusy(true); try { await experienceApi.removeMedia(draft.id, mediaId); const next = await experienceApi.get(draft.id); setDraft(next); manager.actions.merge(next); }
    catch (error) { onNotice(error, "error"); } finally { setBusy(false); }
  }

  async function setCover(mediaId) {
    setBusy(true); try { await experienceApi.setCover(draft.id, mediaId); const next = { ...draft, coverMediaId: mediaId }; setDraft(next); manager.actions.merge(next); }
    catch (error) { onNotice(error, "error"); } finally { setBusy(false); }
  }

  function changeMedia(mediaId, patch) {
    setDraft((value) => ({ ...value, media: value.media.map((item) => item.id === mediaId ? { ...item, ...patch } : item) }));
  }

  async function persistMedia(item) {
    try {
      const saved = await experienceApi.updateMedia(draft.id, item.id, { momentId: item.momentId || null,
        caption: item.caption || "", altText: item.altText || "", sortOrder: item.sortOrder || 0 });
      setDraft((value) => ({ ...value, media: value.media.map((media) => media.id === saved.id ? saved : media) }));
    } catch (error) { onNotice(error, "error"); }
  }

  async function publish(options) {
    let target = dirty || !draft.id ? await save() : draft;
    if (!target) return;
    setBusy(true); try { const publication = await experienceApi.publish(target.id, options); const next = await experienceApi.get(target.id); setDraft(next); manager.actions.merge(next); onNotice(`Shared copy is ${publication.visibility.toLowerCase()} and ready to copy.`, "success"); }
    catch (error) { onNotice(error, "error"); } finally { setBusy(false); }
  }

  async function openPublish() {
    if (dirty || !draft.id) {
      const saved = await save();
      if (!saved) return;
    }
    setPublishOpen(true);
  }

  async function unpublish() {
    setBusy(true); try { await experienceApi.unpublish(draft.id); const next = { ...draft, visibility: "PRIVATE", publishedSlug: null }; setDraft(next); manager.actions.merge(next); setPublishOpen(false); onNotice("Experience returned to private.", "success"); }
    catch (error) { onNotice(error, "error"); } finally { setBusy(false); }
  }

  async function removeExperience() {
    if (!window.confirm("Delete this experience and all its private photos? This cannot be undone.")) return;
    setBusy(true); try { await manager.actions.remove(draft.id); navigate("/experiences"); onNotice("Experience deleted.", "success"); }
    catch (error) { onNotice(error, "error"); } finally { setBusy(false); }
  }

  const dateFields = draft.experienceType === "TRAVEL";
  const momentCount = draft.moments?.length || 0;
  const storyWords = useMemo(() => draft.story.trim().match(/\S+/gu)?.length || 0, [draft.story]);
  if (loading) return <div className="page-state"><span className="spin"><SparkleLoader /></span><strong>Opening this experience…</strong></div>;

  return <div className={`page-stack experience-editor experience-tone--${details.tone}`}>
    <header className="editor-topline"><button className="back-link" type="button" onClick={() => { if (!dirty || window.confirm("Leave without saving these changes?")) navigate("/experiences"); }}><ArrowLeft size={17} />Library</button><span className={`editor-privacy editor-privacy--${draft.visibility?.toLowerCase()}`}>{draft.visibility === "PRIVATE" ? <LockKeyhole size={14} /> : <Globe2 size={14} />}{draft.visibility === "PRIVATE" ? "Private draft" : `${draft.visibility.toLowerCase()} snapshot live`}</span><span className="editor-save-state">{dirty ? "Unsaved changes" : draft.id ? "All changes saved" : "New experience"}</span><button className="button button--ghost" type="button" disabled={busy} onClick={save}><Save size={17} />{busy ? "Working…" : "Save"}</button><button className="button button--primary" type="button" disabled={busy} onClick={openPublish}><Globe2 size={17} />Share</button></header>

    <section className="editor-title-block">
      <div className="experience-type-switcher">{experienceTypes.map((item) => { const Icon = item.icon; return <button key={item.value} className={draft.experienceType === item.value ? "is-active" : ""} type="button" onClick={() => changeType(item.value)}><Icon size={15} />{item.label}</button>; })}</div>
      <input className="editor-title" maxLength="160" placeholder={details.prompt} value={draft.title} onChange={(event) => change({ title: event.target.value })} />
      <input className="editor-subtitle" maxLength="240" placeholder="A short line that takes you back there" value={draft.subtitle} onChange={(event) => change({ subtitle: event.target.value })} />
    </section>

    <div className="editor-grid">
      <main>
        <section className="panel editor-section story-editor"><header><div><span className="eyebrow">The big picture</span><h2>Tell it in your voice</h2></div><span>{storyWords} words</span></header><Field label="A short takeaway" hint="shown on cards and at the start of a shared story"><textarea rows="3" maxLength="600" placeholder="What made this experience memorable?" value={draft.summary} onChange={(event) => change({ summary: event.target.value })} /></Field><Field label="The full story"><textarea className="story-textarea" rows="13" maxLength="100000" placeholder="Begin wherever the memory begins—what you expected, what happened, and what stayed with you…" value={draft.story} onChange={(event) => change({ story: event.target.value })} /></Field></section>

        <section className="panel editor-section moments-editor"><header><div><span className="eyebrow">The experience, unfolded</span><h2>Moments & chapters</h2><p>Build a trip day by day, or keep the parts of a meal, film, or activity separately.</p></div><button className="button button--secondary" type="button" onClick={() => change({ moments: [...draft.moments, blankMoment(typeMoment, momentCount)] })}><Plus size={16} />Add moment</button></header>
          {momentCount ? <div className="moment-editor-list">{draft.moments.map((moment, index) => <article key={moment.id || `new-${index}`}><header><span>{String(index + 1).padStart(2, "0")}</span><input maxLength="160" placeholder={draft.experienceType === "TRAVEL" ? `Day ${index + 1} highlight` : "Moment title"} value={moment.title} onChange={(event) => updateMoment(index, { title: event.target.value })} /><div><button type="button" disabled={!index} onClick={() => { const next = [...draft.moments]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change({ moments: next }); }} aria-label="Move up"><ArrowUp size={15} /></button><button type="button" disabled={index === momentCount - 1} onClick={() => { const next = [...draft.moments]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; change({ moments: next }); }} aria-label="Move down"><ArrowDown size={15} /></button><button type="button" onClick={() => change({ moments: draft.moments.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Remove moment"><Trash2 size={15} /></button></div></header><div className="moment-editor-fields"><Field label="Kind"><select value={moment.momentType} onChange={(event) => updateMoment(index, { momentType: event.target.value })}>{momentTypes.map((type) => <option key={type} value={type}>{type.toLowerCase()}</option>)}</select></Field><Field label="Date"><input type="date" value={moment.momentDate || ""} onChange={(event) => updateMoment(index, { momentDate: event.target.value || null })} /></Field><Field label="Place"><input maxLength="180" placeholder="Restaurant, stay, cinema…" value={moment.placeName} onChange={(event) => updateMoment(index, { placeName: event.target.value })} /></Field><Field label="Location"><input maxLength="300" placeholder="Area or address" value={moment.location} onChange={(event) => updateMoment(index, { location: event.target.value })} /></Field></div><Field label="What happened"><textarea rows="5" maxLength="20000" placeholder="The details, texture, surprises, and how this part felt…" value={moment.body} onChange={(event) => updateMoment(index, { body: event.target.value })} /></Field><div className="moment-editor-footer"><Rating label="Moment rating" value={moment.rating} onChange={(rating) => updateMoment(index, { rating })} /><Field label="Cost"><div className="money-input"><input value={moment.currency || draft.currency} maxLength="3" onChange={(event) => updateMoment(index, { currency: event.target.value.toUpperCase() })} /><input type="number" min="0" step="0.01" placeholder="Optional" value={moment.cost ?? ""} onChange={(event) => updateMoment(index, { cost: event.target.value })} /></div></Field></div></article>)}</div> : <button className="moment-empty" type="button" onClick={() => change({ moments: [blankMoment(typeMoment, 0)] })}><Plus size={20} /><strong>Add the first moment</strong><span>{draft.experienceType === "TRAVEL" ? "Start with day one, the journey, a stay, or a meal." : "Keep one scene, taste, feeling, or turning point."}</span></button>}
        </section>

        <section className="panel editor-section media-editor"><header><div><span className="eyebrow">Visual memory</span><h2>Photos</h2><p>Choose up to 30 JPEG, PNG, or WebP images. You decide which ones are shared.</p></div><button className="button button--secondary" type="button" disabled={busy || draft.media?.length >= 30} onClick={() => fileRef.current?.click()}><ImagePlus size={17} />Add photos</button><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => upload(event.target.files)} /></header>
          {draft.media?.length ? <div className="media-grid">{draft.media.map((media) => <article className={`media-card ${draft.coverMediaId === media.id ? "is-cover" : ""}`} key={media.id}><div><ExperienceImage experienceId={draft.id} media={media} /><span><button type="button" onClick={() => setCover(media.id)}>{draft.coverMediaId === media.id ? <><Check size={14} />Cover</> : "Make cover"}</button><button type="button" onClick={() => removeMedia(media.id)} aria-label="Delete photo"><Trash2 size={15} /></button></span></div><input maxLength="300" aria-label="Photo caption" placeholder="Add a caption" value={media.caption || ""} onChange={(event) => changeMedia(media.id, { caption: event.target.value })} onBlur={() => persistMedia(media)} /><input maxLength="300" aria-label="Photo description" placeholder="Describe it for accessibility" value={media.altText || ""} onChange={(event) => changeMedia(media.id, { altText: event.target.value })} onBlur={() => persistMedia(media)} />{!!draft.moments.length && <select aria-label="Attach photo to a moment" value={media.momentId || ""} onChange={(event) => { const next = { ...media, momentId: event.target.value ? Number(event.target.value) : null }; changeMedia(media.id, { momentId: next.momentId }); persistMedia(next); }}><option value="">Whole experience</option>{draft.moments.filter((moment) => moment.id).map((moment) => <option key={moment.id} value={moment.id}>{moment.title}</option>)}</select>}</article>)}</div> : <div className="media-empty"><ImagePlus size={23} /><span>Photos can turn a record into a place you can return to.</span></div>}
        </section>
      </main>

      <aside className="editor-details">
        <section className="panel"><header><span className="eyebrow">Context</span><h2>When & where</h2></header>{dateFields ? <div className="two-fields"><Field label="Started"><input type="date" value={draft.startDate || ""} onChange={(event) => change({ startDate: event.target.value || null })} /></Field><Field label="Ended"><input type="date" min={draft.startDate || undefined} value={draft.endDate || ""} onChange={(event) => change({ endDate: event.target.value || null })} /></Field></div> : <Field label="Date"><input type="date" value={draft.occurredOn || ""} onChange={(event) => change({ occurredOn: event.target.value || null })} /></Field>}<Field label="Place name"><div className="icon-input"><MapPin size={16} /><input maxLength="180" placeholder={draft.experienceType === "MOVIE" ? "Movie title or cinema" : "Kerala, KFC, the beach…"} value={draft.placeName} onChange={(event) => change({ placeName: event.target.value })} /></div></Field><Field label="Location"><input maxLength="300" placeholder="City, neighbourhood, or address" value={draft.location} onChange={(event) => change({ location: event.target.value })} /></Field><Field label="Venue"><input maxLength="180" placeholder="Hotel, cinema, restaurant…" value={draft.venue} onChange={(event) => change({ venue: event.target.value })} /></Field><Field label="With"><div className="icon-input"><Users size={16} /><input maxLength="300" placeholder="Solo, family, friends…" value={draft.companions} onChange={(event) => change({ companions: event.target.value })} /></div></Field></section>
        <section className="panel"><header><span className="eyebrow">Your verdict</span><h2>How was it?</h2></header><Rating value={draft.rating} onChange={(rating) => change({ rating })} /><Field label="Recommendation"><select value={draft.recommendation || ""} onChange={(event) => change({ recommendation: event.target.value || null })}><option value="">No verdict yet</option>{recommendations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Category"><input maxLength="100" placeholder="Road trip, thriller, fast food…" value={draft.category} onChange={(event) => change({ category: event.target.value })} /></Field><Field label="Overall cost"><div className="money-input"><input value={draft.currency} maxLength="3" onChange={(event) => change({ currency: event.target.value.toUpperCase() })} /><input type="number" min="0" step="0.01" placeholder="Optional" value={draft.overallCost ?? ""} onChange={(event) => change({ overallCost: event.target.value })} /></div></Field></section>
        <section className="panel editor-tags"><header><span className="eyebrow">Find it later</span><h2>Tags</h2></header><TagEditor tags={draft.tags || []} max={12} sanitize={sanitizeExperienceTags} onChange={(tags) => change({ tags })} /></section>
        {draft.id && <section className="editor-danger"><button type="button" onClick={() => change({ state: draft.state === "ARCHIVED" ? "DRAFT" : "ARCHIVED" })}>{draft.state === "ARCHIVED" ? "Restore from archive" : "Move to archive"}</button><button type="button" onClick={removeExperience}><Trash2 size={15} />Delete experience</button></section>}
      </aside>
    </div>
    {publishOpen && <PublishPanel experience={draft} busy={busy} onClose={() => setPublishOpen(false)} onPublish={publish} onUnpublish={unpublish} />}
  </div>;
}

function SparkleLoader() { return <CalendarDays size={23} />; }
