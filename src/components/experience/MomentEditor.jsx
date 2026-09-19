import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { momentTypes } from "../../lib/experiences";
import { makeMoment, moveMomentWithinDay } from "../../lib/experienceTemplates";
import { DateField, Field, Rating, TextField, Verdict, WritingArea } from "./WritingFields";
import { MomentPhotos } from "./PhotoPanel";

export function addMoment(editor, type, date, title, onNotice) {
  if (editor.draft.moments.length >= 100) { onNotice("You can keep up to 100 chapters, stops or notes in one experience.", "error"); return; }
  editor.change({ moments: [...editor.draft.moments, { ...makeMoment(type, date, editor.draft, title), _key: crypto.randomUUID() }] });
}

export default function MomentEditor({ editor, index, variant = "note", onNotice }) {
  const { draft, change } = editor, moment = draft.moments[index];
  const patch = (value) => change({ moments: draft.moments.map((item, i) => i === index ? { ...item, ...value } : item) });
  const positions = draft.moments.map((item, i) => (item.momentDate || "") === (moment.momentDate || "") ? i : -1).filter((i) => i >= 0);
  const position = positions.indexOf(index);
  const isDish = variant === "dish";
  const labels = { RESTAURANT: "Meal", FOOD: "Dish", STAY: "Stay", JOURNEY: "Getting there", ACTIVITY: "Activity", MOVIE: "Movie", DAY: "Day notes", MEMORY: "Memory" };
  function remove() {
    if (moment.id && draft.media.some((image) => image.momentId === moment.id)) {
      onNotice("Move or delete the attached photos in Photos, then save before removing this entry.", "error"); return;
    }
    if (window.confirm(`Remove ${moment.title || "this entry"}? This takes effect when you save.`)) change({ moments: draft.moments.filter((_, i) => i !== index) });
  }
  return <article className={`writer-moment writer-moment--${variant}`}>
    <header><span>{isDish ? "On the table" : labels[moment.momentType] || "Note"}</span><div>
      <button type="button" aria-label="Move earlier in this day" disabled={position === 0} onClick={() => change({ moments: moveMomentWithinDay(draft.moments, index, -1) })}><ArrowUp size={15} /></button>
      <button type="button" aria-label="Move later in this day" disabled={position === positions.length - 1} onClick={() => change({ moments: moveMomentWithinDay(draft.moments, index, 1) })}><ArrowDown size={15} /></button>
      <button type="button" aria-label={`Remove ${moment.title || "entry"}`} onClick={remove}><Trash2 size={15} /></button>
    </div></header>
    <TextField label={isDish ? "Dish name" : "Name or title"} value={moment.title} maxLength={160} placeholder={isDish ? "What did you order?" : "Name this stop"} onChange={(title) => patch({ title })} />
    <WritingArea compact label={isDish ? "How did it taste?" : "Your notes"} value={moment.body} maxLength={20000} onChange={(body) => patch({ body })}
      placeholder={isDish ? "Flavour, portion, what you'd change next time…" : "What do you want to remember about this part?"} />
    {isDish && <div className="writer-field-grid"><Rating label="Dish rating" value={moment.rating} onChange={(rating) => patch({ rating })} /><Verdict label="Order again?" value={moment.recommendation} onChange={(recommendation) => patch({ recommendation })} /></div>}
    <MomentPhotos editor={editor} index={index} />
    <details className="writer-small-details"><summary>More details</summary><div className="writer-field-grid">
      <DateField label="Date" value={moment.momentDate} min={draft.startDate || undefined} max={draft.endDate || undefined} onChange={(momentDate) => patch({ momentDate })} />
      <TextField label="Place" value={moment.placeName} onChange={(placeName) => patch({ placeName })} />
      <TextField label="Location" value={moment.location} maxLength={300} onChange={(location) => patch({ location })} />
      <Field label="Cost"><input type="number" min="0" step="0.01" value={moment.cost ?? ""} onChange={(event) => patch({ cost: event.target.value })} /></Field>
      <TextField label="Currency" value={moment.currency} maxLength={3} onChange={(value) => patch({ currency: value.toUpperCase() })} />
      <Field label="Kind"><select value={moment.momentType} onChange={(event) => patch({ momentType: event.target.value })}>{momentTypes.map((type) => <option key={type} value={type}>{labels[type] || type}</option>)}</select></Field>
      {!isDish && <><Rating value={moment.rating} onChange={(rating) => patch({ rating })} /><Verdict value={moment.recommendation} onChange={(recommendation) => patch({ recommendation })} /></>}
    </div></details>
  </article>;
}

export function AdditionalNotes({ editor, onNotice }) {
  if (!editor.draft.moments.length) return null;
  return <details className="writer-details" open={!editor.draft.story.trim() || undefined}><summary>Additional notes <span>{editor.draft.moments.length}</span></summary><div className="writer-details__body">
    {editor.draft.moments.map((moment, index) => <MomentEditor key={moment.id || moment._key || index} editor={editor} index={index} onNotice={onNotice} />)}
  </div></details>;
}

export function AddMomentButton({ editor, type, date, title = "", children, onNotice }) {
  return <button type="button" className="writer-text-button" onClick={() => addMoment(editor, type, date, title, onNotice)}><Plus size={16} />{children}</button>;
}
