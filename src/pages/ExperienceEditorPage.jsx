import { ArrowLeft, Eye, Focus, LockKeyhole, PenLine, Save, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ExperienceSharingDialog from "../components/ExperienceSharingDialog";
import ExperienceStory from "../components/ExperienceStory";
import LeaveExperienceDialog from "../components/LeaveExperienceDialog";
import ActivityEditor from "../components/experience/ActivityEditor";
import FoodEditor from "../components/experience/FoodEditor";
import MemoryEditor from "../components/experience/MemoryEditor";
import MovieEditor from "../components/experience/MovieEditor";
import TripEditor from "../components/experience/TripEditor";
import PhotoPanel, { UploadQueue } from "../components/experience/PhotoPanel";
import { useExperienceEditor } from "../hooks/useExperienceEditor";
import { experienceTemplates, templateFor, typeForRoute } from "../lib/experienceTemplates";
import { ExperienceTypePicker } from "./ExperiencesPage";

const editors = { TRAVEL: TripEditor, MOVIE: MovieEditor, FOOD: FoodEditor, ACTIVITY: ActivityEditor, GENERAL: MemoryEditor };

export default function ExperienceEditorPage({ manager, onNotice }) {
  const { id, kind } = useParams();
  const [params] = useSearchParams();
  const legacyType = experienceTemplates.some((item) => item.type === params.get("type")) ? params.get("type") : null;
  const type = typeForRoute(kind) || (!kind && legacyType);
  if (!id && !type) return <div className="new-journal-page"><Link className="writer-text-button" to="/experiences"><ArrowLeft size={17} />Your journal</Link>
    <h1>What would you like to keep?</h1><p>Choose a page that fits. Every entry starts private.</p><ExperienceTypePicker /></div>;
  return <Editor key={`${manager.userId}:${id || type}`} id={id} type={type || "GENERAL"} manager={manager} onNotice={onNotice} />;
}

function Editor({ id, type, manager, onNotice }) {
  const [publicationBusy, setPublicationBusy] = useState(false);
  const editor = useExperienceEditor(id, type, manager, onNotice, publicationBusy);
  const { draft, dirty, busy, loading } = editor;
  const [view, setView] = useState("write"), [sharing, setSharing] = useState(false), [focus, setFocus] = useState(false);
  const sharingRequested = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    document.body.classList.toggle("journal-focus", focus);
    return () => document.body.classList.remove("journal-focus");
  }, [focus]);
  useEffect(() => {
    if (!id && draft.id && !busy && !dirty && !sharing && !sharingRequested.current && !editor.pendingCapture && !editor.error && !editor.uploads.some((item) => item.status !== "done")) {
      navigate(`/experiences/${draft.id}`, { replace: true });
    }
  }, [id, draft.id, busy, dirty, sharing, editor.pendingCapture, editor.error, editor.uploads, navigate]);
  useEffect(() => {
    const save = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault(); if (!busy && !sharing && !editor.uncertainCreate) void editor.save();
    } };
    window.addEventListener("keydown", save); return () => window.removeEventListener("keydown", save);
  }, [editor.save, busy, sharing, editor.uncertainCreate]);
  async function share() {
    if (editor.pendingCapture) { setView("write"); onNotice("Save the quick-capture notes before sharing.", "error"); return; }
    if (editor.uploads.some((item) => item.status !== "done")) { onNotice("Retry or dismiss the unfinished photo uploads before sharing.", "error"); return; }
    sharingRequested.current = true;
    const target = dirty || !draft.id ? await editor.save() : draft;
    if (target) setSharing(true);
    else sharingRequested.current = false;
  }
  async function copyDraft() {
    try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2)); onNotice("Draft copied. Keep it somewhere private."); }
    catch { onNotice("Select and copy your writing before reloading; clipboard access is unavailable.", "error"); }
  }
  if (loading) return <div className="page-state" role="status">Opening your journal…</div>;
  if (id && !draft.id) return <div className="page-state"><p role="alert">{editor.error || "This entry could not be opened."}</p><button type="button" className="button button--ghost" onClick={editor.reload}>Retry</button><Link to="/experiences">Your journal</Link></div>;
  const TypeEditor = editors[draft.experienceType] || MemoryEditor;
  return <div className={`experience-writer writer-type--${draft.experienceType.toLowerCase()}`}>
    <header className="writer-toolbar"><Link to="/experiences" className="writer-back"><ArrowLeft size={18} /><span>Your journal</span></Link>
      <span className="writer-toolbar-kind">{templateFor(draft.experienceType).name}</span>
      <span className="writer-save-state" role="status">{busy ? "Saving…" : editor.pendingCapture ? "Quick notes not saved" : dirty ? "Unsaved changes" : draft.id ? "Saved" : "New entry"}</span>
      <button type="button" className="writer-text-button" aria-pressed={focus} onClick={() => setFocus(!focus)}><Focus size={17} /><span>{focus ? "Exit focus" : "Focus"}</span></button>
      <button type="button" className="writer-text-button" disabled={busy} onClick={() => setView(view === "write" ? "read" : "write")}>{view === "write" ? <Eye size={17} /> : <PenLine size={17} />}<span>{view === "write" ? "Read" : "Write"}</span></button>
      <button type="button" className="button button--ghost" disabled={busy || editor.uncertainCreate} onClick={editor.save}><Save size={16} />Save</button>
      <button type="button" className="button button--primary" disabled={busy || editor.uncertainCreate} onClick={share}><Share2 size={16} />Share</button>
    </header>
    {draft.publishedSlug && <p className="writer-snapshot-note"><LockKeyhole size={13} />You’re editing the private copy. Your {draft.visibility === "PUBLIC" ? "public" : "link-only"} story changes only when you publish again.</p>}
    {editor.error && <div role="alert" className="journal-error"><p>{editor.error}</p>{(editor.conflict || editor.uncertainCreate) && <div><button type="button" className="button button--ghost" onClick={copyDraft}>Copy my draft</button>{draft.id ? <button type="button" className="button button--ghost" disabled={busy} onClick={editor.reload}>Reload saved version</button> : <Link to="/experiences">Check your journal</Link>}</div>}</div>}
    {view === "read" && <section className="writer-reading"><p className="writer-private-note"><LockKeyhole size={14} />Private reading view. Sharing has its own privacy preview.</p><ExperienceStory story={draft} experienceId={draft.id} /></section>}
    <fieldset className="writer-edit-surface" hidden={view !== "write"} disabled={busy || sharing || editor.uncertainCreate}><legend className="sr-only">Write your {templateFor(draft.experienceType).name.toLowerCase()}</legend>
      <TypeEditor editor={editor} onNotice={onNotice} />
      <div className="writer-extras"><PhotoPanel editor={editor} />
        {draft.id && <details className="writer-details"><summary>Manage entry</summary><div className="writer-details__body">
          <button type="button" className="writer-text-button" onClick={() => editor.change({ state: draft.state === "ARCHIVED" ? "DRAFT" : "ARCHIVED" })}>{draft.state === "ARCHIVED" ? "Restore on next save" : "Archive on next save"}</button>
          <p className="writer-muted">Archiving doesn’t revoke a shared link. Use Share → Make private.</p>
          <button type="button" className="writer-danger-button" onClick={() => {
            if (window.confirm("Permanently delete this entry, its photos and shared link?")) void editor.run(async () => {
              await manager.actions.remove(draft.id); editor.allowExit(); navigate("/experiences", { replace: true });
            });
          }}>Delete entry</button>
        </div></details>}
      </div>
    </fieldset>
    <UploadQueue editor={editor} />
    {sharing && <ExperienceSharingDialog experience={draft} onClose={() => { sharingRequested.current = false; setPublicationBusy(false); setSharing(false); }} onPublished={editor.refresh} onNotice={onNotice} onBusyChange={setPublicationBusy} />}
    <LeaveExperienceDialog blocker={editor.blocker} busy={busy || publicationBusy} />
  </div>;
}
