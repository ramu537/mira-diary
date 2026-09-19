import { ArrowDown, ArrowLeft, ArrowUp, Camera, Check, Eye, Globe2, LockKeyhole, Save, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { experienceApi } from "../api/experiences";
import ExperienceImage from "../components/ExperienceImage";
import ExperienceSharingDialog from "../components/ExperienceSharingDialog";
import ExperienceStory from "../components/ExperienceStory";
import MemoryPassport from "../components/MemoryPassport";
import LeaveExperienceDialog from "../components/LeaveExperienceDialog";
import QuickMemoryCapture from "../components/QuickMemoryCapture";
import TagEditor from "../components/TagEditor";
import { useExperienceEditor } from "../hooks/useExperienceEditor";
import { experienceTypes, momentTypes, recommendations, sanitizeExperienceTags } from "../lib/experiences";
import { dayNumber, groupMoments, tripDays } from "../lib/tripJournal";

function Field({ label, children }) { return <label className="experience-field"><span>{label}</span>{children}</label>; }
function Rating({ value, onChange }) {
  return <fieldset className="experience-rating"><legend>Rating (optional)</legend><div>{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number} aria-label={`${number} stars`} aria-pressed={value === number} onClick={() => onChange(value === number ? null : number)}><Star size={18} fill={number <= (value || 0) ? "currentColor" : "none"} /></button>)}</div></fieldset>;
}

export default function ExperienceEditorPage({ manager, onNotice }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const type = experienceTypes.some((item) => item.value === params.get("type")) ? params.get("type") : "TRAVEL";
  return <Editor key={`${manager.userId}:${id || `new-${type}`}`} id={id} type={type} manager={manager} onNotice={onNotice} />;
}

function Editor({ id, type, manager, onNotice }) {
  const editor = useExperienceEditor(id, type, manager, onNotice);
  const { draft, saved, change, busy, loading, dirty } = editor;
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("capture");
  const [sharing, setSharing] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [uploadMoment, setUploadMoment] = useState("");
  const fileInput = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!id && draft.id && !busy && !dirty && !editor.pendingCapture && !editor.error && !editor.uploads.some((item) => item.status !== "done")) {
      navigate(`/experiences/${draft.id}`, { replace: true });
    }
  }, [id, draft.id, busy, dirty, editor.pendingCapture, editor.error, editor.uploads, navigate]);
  const days = useMemo(() => tripDays(draft), [draft.startDate, draft.endDate, draft.moments]);
  const groups = useMemo(() => groupMoments(draft), [draft]);
  const date = selectedDate ?? (draft.startDate || draft.occurredOn || "");
  const patchMoment = (index, patch) => change({ moments: draft.moments.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const patchImage = (id, patch) => change({ media: draft.media.map((item) => item.id === id ? { ...item, ...patch } : item) });
  function move(index, direction) {
    const positions = draft.moments.map((item, i) => (item.momentDate || null) === (draft.moments[index].momentDate || null) ? i : -1).filter((i) => i >= 0);
    const destination = positions[positions.indexOf(index) + direction];
    if (destination == null) return;
    const next = [...draft.moments];
    [next[index], next[destination]] = [next[destination], next[index]];
    change({ moments: next });
  }
  async function share() {
    if (editor.pendingCapture) { setView("capture"); onNotice("Save your current moment before reviewing the shared story.", "error"); return; }
    const target = dirty || !draft.id ? await editor.save() : draft;
    if (target) setSharing(true);
  }
  async function copyDraft() {
    try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2)); onNotice("Draft copied. Keep it somewhere private before reloading."); }
    catch { onNotice("Copy is unavailable. Select and copy your unsaved text before reloading.", "error"); }
  }
  if (loading) return <div className="page-state" role="status">Opening your experience…</div>;
  if (id && !draft.id) return <div className="page-state"><p role="alert">{editor.error || "This experience could not be opened."}</p><button className="button button--ghost" onClick={editor.reload} type="button">Retry</button><Link to="/experiences">Back to experiences</Link></div>;

  return <div className="page-stack trip-workspace">
    <header className="trip-toolbar"><Link to="/experiences" className="back-link"><ArrowLeft size={17} />Experiences</Link><span className="editor-privacy"><LockKeyhole size={14} />Private working copy</span>
      <span role="status" className="editor-save-state">{busy ? "Saving…" : editor.pendingCapture ? "Moment not yet saved" : dirty ? "Unsaved changes" : draft.id ? "Saved" : "New experience"}</span>
      <button className="button button--ghost" type="button" disabled={busy || editor.uncertainCreate} onClick={editor.save}><Save size={16} />Save</button>
      <button className="button button--primary" type="button" disabled={busy || editor.uncertainCreate} onClick={share}><Globe2 size={16} />Share</button>
    </header>
    {editor.error && <div role="alert" className="journal-error"><p>{editor.error}</p>{(editor.conflict || editor.uncertainCreate) && <div><button className="button button--ghost" type="button" onClick={copyDraft}>Copy my draft</button>{draft.id ? <button className="button button--ghost" type="button" disabled={busy} onClick={editor.reload}>Reload saved version</button> : <Link to="/experiences">Check library</Link>}</div>}</div>}
    <fieldset disabled={busy || sharing} className="trip-fields"><legend className="sr-only">Experience editor</legend>
      <section className="trip-heading"><div className="experience-type-switcher">{experienceTypes.map((item) => {
        const Icon = item.icon;
        return <button type="button" key={item.value} aria-pressed={draft.experienceType === item.value} className={draft.experienceType === item.value ? "is-active" : ""} onClick={() => {
          if (item.value === draft.experienceType) return;
          if (item.value === "TRAVEL") change({ experienceType: item.value, startDate: draft.occurredOn, endDate: null, occurredOn: null });
          else change({ experienceType: item.value, occurredOn: draft.startDate || draft.occurredOn, startDate: null, endDate: null, moments: draft.moments.map((moment) => ({ ...moment, dayNumber: null })) });
          setSelectedDate(null);
        }}><Icon size={16} />{item.label}</button>;
      })}</div><label className="sr-only" htmlFor="trip-name">Experience name</label><input id="trip-name" className="editor-title" value={draft.title} maxLength={160} placeholder={draft.experienceType === "TRAVEL" ? "Give this trip a name…" : "Name this experience…"} onChange={(event) => change({ title: event.target.value })} />
        <div className="trip-context-fields"><Field label="Place (optional)"><input placeholder="Kerala, the coast, a favourite café…" value={draft.placeName} maxLength={180} onChange={(event) => change({ placeName: event.target.value })} /></Field>
          {draft.experienceType === "TRAVEL" ? <><Field label="Started (optional)"><input type="date" value={draft.startDate || ""} onChange={(event) => change({ startDate: event.target.value || null })} /></Field><Field label="Ended (optional)"><input type="date" min={draft.startDate || undefined} value={draft.endDate || ""} onChange={(event) => change({ endDate: event.target.value || null })} /></Field></> : <Field label="Date (optional)"><input type="date" value={draft.occurredOn || ""} onChange={(event) => change({ occurredOn: event.target.value || null })} /></Field>}</div>
      </section>
      <div className="journal-view-switch" aria-label="Experience view"><button type="button" aria-pressed={view === "capture"} onClick={() => setView("capture")}>Capture & arrange</button><button type="button" aria-pressed={view === "story"} onClick={() => setView("story")}><Eye size={16} />Read my story</button><small>{draft.moments.length} moments · {draft.media.length} photos{draft.publishedSlug ? ` · ${draft.visibility === "PUBLIC" ? "Public" : "Link-only"} snapshot live` : " · Not shared"}</small></div>
    </fieldset>
    {view === "story" && <><p className="private-reader-note"><LockKeyhole size={16} />Private preview, including edited moments. Save a new capture to include it here. Use Share to review the public copy.</p><ExperienceStory story={draft} experienceId={draft.id} /></>}
    <div className="trip-layout" hidden={view !== "capture"}><div className="trip-main">
      {!!days.length && <nav className="trip-day-strip" aria-label="Choose a capture day">{days.map((item) => <button key={item} type="button" disabled={busy} aria-pressed={date === item} onClick={() => { setSelectedDate(item); setDayFilter(item); }}><strong>{dayNumber(draft.startDate, item) ? `Day ${dayNumber(draft.startDate, item)}` : item}</strong><small>{item}</small><span>{draft.moments.filter((moment) => moment.momentDate === item).length} moments</span></button>)}</nav>}
      <QuickMemoryCapture experience={draft} selectedDate={date} onDateChange={setSelectedDate} busy={busy || editor.uncertainCreate} onCapture={editor.capture} onPendingChange={editor.setPendingCapture} />
      {!!editor.uploads.length && <section className="upload-queue panel" aria-label="Photo uploads"><h2>Photo uploads</h2><ul>{editor.uploads.map((item) => <li key={item.key}><span>{item.name}<small role="status">{item.status === "done" ? "Uploaded" : item.status === "uploading" ? "Uploading…" : item.status === "failed" ? item.error : "Waiting"}</small></span>{item.status === "failed" && <button type="button" className="button button--ghost" disabled={busy} onClick={() => editor.retryUpload(item)}>Retry photo</button>}{!busy && item.status !== "uploading" && <button type="button" className="icon-button" aria-label={`Dismiss ${item.name}`} onClick={() => editor.dismissUpload(item.key)}>×</button>}</li>)}</ul></section>}
      <section className="trip-timeline panel"><header><div><span className="eyebrow">Your experience, piece by piece</span><h2>Moments</h2></div><select aria-label="Filter moments by day" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}><option value="all">All days</option>{groups.map((group) => <option value={group.date || "undated"} key={group.date || "undated"}>{group.day ? `Day ${group.day} · ` : ""}{group.date || "Undated"}</option>)}</select></header>
        {!groups.length && <div className="trip-empty"><Camera size={26} /><h3>One small memory is enough.</h3><p>A meal, a view, a funny detour. Start above and let the story grow.</p></div>}
        {groups.filter((group) => dayFilter === "all" || (group.date || "undated") === dayFilter).map((group) => <div className="timeline-day" key={group.date || "undated"}><h3>{group.day ? `Day ${group.day} · ` : ""}{group.date || "Not dated yet"}</h3>{group.moments.map((moment) => {
          const index = draft.moments.indexOf(moment), dayIndex = group.moments.indexOf(moment);
          return <details className="timeline-moment" key={moment.id || `new-${index}`}><summary><span className="moment-kind">{moment.momentType.toLowerCase()}</span><strong>{moment.title || "Untitled moment"}</strong><span>{draft.media.filter((item) => item.momentId && item.momentId === moment.id).length} photos</span></summary>
            <fieldset disabled={busy}><legend className="sr-only">Edit {moment.title}</legend><Field label="Title"><input maxLength={160} value={moment.title} onChange={(event) => patchMoment(index, { title: event.target.value })} /></Field><Field label="Your memory"><textarea rows={3} maxLength={20000} value={moment.body} onChange={(event) => patchMoment(index, { body: event.target.value })} /></Field>
              <div className="two-fields"><Field label="Date"><input type="date" min={draft.startDate || undefined} max={draft.endDate || undefined} value={moment.momentDate || ""} onChange={(event) => patchMoment(index, { momentDate: event.target.value || null })} /></Field><Field label="Kind"><select value={moment.momentType} onChange={(event) => patchMoment(index, { momentType: event.target.value })}>{momentTypes.map((item) => <option key={item} value={item}>{item.toLowerCase()}</option>)}</select></Field></div>
              <details className="journal-details"><summary>Add place, rating or cost</summary><div className="two-fields"><Field label="Place"><input maxLength={180} value={moment.placeName} onChange={(event) => patchMoment(index, { placeName: event.target.value })} /></Field><Field label="Location"><input maxLength={300} value={moment.location} onChange={(event) => patchMoment(index, { location: event.target.value })} /></Field></div><Rating value={moment.rating} onChange={(rating) => patchMoment(index, { rating })} /><Field label="Recommendation"><select value={moment.recommendation || ""} onChange={(event) => patchMoment(index, { recommendation: event.target.value || null })}><option value="">No verdict yet</option>{recommendations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="two-fields"><Field label="Cost"><input type="number" step="0.01" min="0" value={moment.cost ?? ""} onChange={(event) => patchMoment(index, { cost: event.target.value })} /></Field><Field label="Currency"><input maxLength={3} value={moment.currency} onChange={(event) => patchMoment(index, { currency: event.target.value.toUpperCase() })} /></Field></div></details>
              <div className="moment-actions"><button type="button" className="button button--ghost" disabled={!moment.id} onClick={() => { setUploadMoment(String(moment.id)); fileInput.current?.click(); }}><Camera size={16} />Add photos</button><button className="icon-button" type="button" aria-label="Move earlier in this day" disabled={dayIndex === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button className="icon-button" type="button" aria-label="Move later in this day" disabled={dayIndex === group.moments.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button className="icon-button" type="button" aria-label="Remove moment" onClick={() => { if (window.confirm("Remove this moment? Attached photos must be moved or removed first.")) { if (moment.id && draft.media.some((item) => item.momentId === moment.id)) { onNotice("Move or remove its photos before deleting this moment.", "error"); return; } change({ moments: draft.moments.filter((_, i) => i !== index) }); } }}><Trash2 size={16} /></button></div>
            </fieldset></details>;
        })}</div>)}
      </section>
      <section className="journal-gallery panel"><header><div><span className="eyebrow">The little details, in pictures</span><h2>Photos</h2></div><button className="button button--ghost" type="button" disabled={busy || draft.media.length >= 30} onClick={() => { setUploadMoment(""); fileInput.current?.click(); }}><Camera size={17} />Add photos</button></header><p>Up to 30 images, 5 MB each. Attach photos to a moment to place them in the story.</p>
        <input ref={fileInput} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { void editor.capture([], [...event.target.files], uploadMoment ? Number(uploadMoment) : null); event.target.value = ""; }} />
        <fieldset disabled={busy}><legend className="sr-only">Photo details</legend><div className="journal-photo-grid">{draft.media.map((image) => <article key={image.id}><ExperienceImage experienceId={draft.id} media={image} /><div className="photo-actions"><button type="button" onClick={() => editor.mediaAction((experienceId) => experienceApi.setCover(experienceId, image.id))}>{draft.coverMediaId === image.id ? <><Check size={14} />Cover</> : "Make cover"}</button><button type="button" aria-label="Delete photo" onClick={() => { if (window.confirm("Delete this photo? Published photos must be excluded and republished first.")) void editor.mediaAction((experienceId) => experienceApi.removeMedia(experienceId, image.id)); }}><Trash2 size={15} /></button></div>
          <Field label="Caption"><input maxLength={300} value={image.caption || ""} onChange={(event) => patchImage(image.id, { caption: event.target.value })} /></Field><details><summary>Photo details</summary><Field label="Accessible description"><input maxLength={300} value={image.altText || ""} onChange={(event) => patchImage(image.id, { altText: event.target.value })} /></Field><Field label="Belongs to"><select value={image.momentId || ""} onChange={(event) => patchImage(image.id, { momentId: event.target.value ? Number(event.target.value) : null })}><option value="">Whole experience</option>{draft.moments.filter((moment) => moment.id).map((moment) => <option key={moment.id} value={moment.id}>{moment.title}</option>)}</select></Field></details>
        </article>)}</div></fieldset>{!draft.media.length && <p className="journal-hint">Your photos will appear here. No caption required.</p>}
      </section>
    </div><aside className="trip-aside"><MemoryPassport saved={saved} />
      <fieldset disabled={busy}><legend className="sr-only">Optional experience details</legend>
        <details className="panel journal-details"><summary>The bigger picture <small>Optional writing</small></summary><Field label="Subtitle"><input maxLength={240} value={draft.subtitle} onChange={(event) => change({ subtitle: event.target.value })} /></Field><Field label="One takeaway"><textarea rows={3} maxLength={600} value={draft.summary} onChange={(event) => change({ summary: event.target.value })} /></Field><Field label="A longer story"><textarea rows={8} maxLength={100000} value={draft.story} onChange={(event) => change({ story: event.target.value })} /></Field><p>Your moments already make a story. This is only if you want to add more.</p></details>
        <details className="panel journal-details"><summary>Details & verdict <small>Places, people, cost</small></summary>{[["location", "Location", 300], ["venue", "Venue", 180], ["companions", "With", 300], ["category", "Category", 100]].map(([key, label, max]) => <Field label={label} key={key}><input maxLength={max} value={draft[key]} onChange={(event) => change({ [key]: event.target.value })} /></Field>)}<Rating value={draft.rating} onChange={(rating) => change({ rating })} /><Field label="Would you recommend it?"><select value={draft.recommendation || ""} onChange={(event) => change({ recommendation: event.target.value || null })}><option value="">No verdict yet</option>{recommendations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="two-fields"><Field label="Overall cost"><input type="number" step="0.01" min="0" value={draft.overallCost ?? ""} onChange={(event) => change({ overallCost: event.target.value })} /></Field><Field label="Currency"><input maxLength={3} value={draft.currency} onChange={(event) => change({ currency: event.target.value.toUpperCase() })} /></Field></div><TagEditor tags={draft.tags} max={12} sanitize={sanitizeExperienceTags} onChange={(tags) => change({ tags })} /></details>
        {draft.id && <details className="panel journal-details"><summary>Manage experience</summary><button className="button button--ghost" type="button" onClick={() => change({ state: draft.state === "ARCHIVED" ? "DRAFT" : "ARCHIVED" })}>{draft.state === "ARCHIVED" ? "Restore from archive" : "Archive on next save"}</button><p>Archiving does not unpublish a shared story. Use Share → Make private to revoke its link.</p><button className="button button--ghost" type="button" onClick={() => { if (window.confirm("Delete this experience, all photos and its shared link? This cannot be undone.")) void editor.run(async () => { await manager.actions.remove(draft.id); editor.allowExit(); navigate("/experiences", { replace: true }); }); }}>Delete experience</button></details>}
      </fieldset>
    </aside></div>
    {sharing && <ExperienceSharingDialog experience={draft} onClose={() => setSharing(false)} onPublished={editor.refresh} onNotice={onNotice} />}
    <LeaveExperienceDialog blocker={editor.blocker} busy={busy} />
  </div>;
}
