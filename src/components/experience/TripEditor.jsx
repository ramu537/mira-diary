import { BookOpen, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { experienceDate } from "../../lib/experiences";
import { dateNumber, dayNumber, tripDays } from "../../lib/tripJournal";
import { writeDay } from "../../lib/experienceTemplates";
import QuickMemoryCapture from "../QuickMemoryCapture";
import MemoryPassport from "../MemoryPassport";
import EntryDetails from "./EntryDetails";
import MomentEditor, { AddMomentButton } from "./MomentEditor";
import { AddPhotos, MomentPhotos } from "./PhotoPanel";
import { DateField, EntryTitle, TextField, WritingArea } from "./WritingFields";

export default function TripEditor({ editor, onNotice }) {
  const { draft, saved, change } = editor;
  const [selected, setSelected] = useState(() => draft.moments.at(-1)?.momentDate || (draft.id && draft.startDate) || "overview");
  const [captureDate, setCaptureDate] = useState(null);
  const days = [...new Set([...tripDays(draft), ...(selected && selected !== "overview" ? [selected] : [])])].sort();
  const date = selected === "overview" ? null : selected;
  const chapterIndex = draft.moments.findIndex((item) => item.momentType === "DAY" && (item.momentDate || "") === date);
  const chapter = chapterIndex >= 0 ? draft.moments[chapterIndex] : null;
  const number = dayNumber(draft.startDate, date);
  function write(body) {
    try { change({ moments: writeDay(draft, date, body) }); }
    catch (error) { onNotice(error.message, "error"); }
  }
  function openDay(value) {
    if (value && (dateNumber(value) == null || (draft.startDate && value < draft.startDate) || (draft.endDate && value > draft.endDate))) {
      onNotice("Choose a day within your trip dates, or adjust the dates in Trip overview.", "error"); return;
    }
    setSelected(value || "");
  }
  return <div className="trip-notebook">
    <aside className="trip-contents"><span className="writer-kicker">Your notebook</span>
      <button type="button" aria-pressed={selected === "overview"} onClick={() => setSelected("overview")}><BookOpen size={16} /><span>Trip overview</span></button>
      <nav aria-label="Trip chapters">{days.map((day) => {
        const count = draft.moments.filter((item) => item.momentDate === day).length;
        const dayIndex = dayNumber(draft.startDate, day);
        return <button type="button" key={day} aria-pressed={selected === day} onClick={() => setSelected(day)}><span><strong>{dayIndex ? `Day ${dayIndex}` : "Chapter"}</strong><small>{experienceDate({ occurredOn: day })}</small></span>{count ? <Check size={14} /> : <ChevronRight size={14} />}</button>;
      })}</nav>
      <DateField label="Open another day" value={date} min={draft.startDate || undefined} max={draft.endDate || undefined} onChange={openDay} />
      <button type="button" aria-pressed={selected === ""} onClick={() => setSelected("")}>Undated notes</button>
      <details className="trip-milestones"><summary>Memory milestones</summary><MemoryPassport saved={saved} /></details>
    </aside>
    <div className="trip-pages">
      {selected === "overview" ? <div className="writer-paper">
        <span className="writer-kicker">Travel journal</span><EntryTitle value={draft.title} onChange={(title) => change({ title })} placeholder="Name your trip" />
        <TextField label="Destination" value={draft.placeName} onChange={(placeName) => change({ placeName })} placeholder="Where did you go?" />
        <div className="writer-field-grid"><DateField label="From" value={draft.startDate} onChange={(startDate) => change({ startDate })} /><DateField label="To" value={draft.endDate} min={draft.startDate || undefined} onChange={(endDate) => change({ endDate })} /></div>
        {draft.startDate && <button type="button" className="writer-next-day" onClick={() => setSelected(draft.startDate)}>Write day one <ChevronRight size={17} /></button>}
        <WritingArea label="An introduction to the trip" value={draft.story} onChange={(story) => change({ story })} placeholder="Why this place? Who came along? Or start with a day from the notebook." />
        <AddPhotos editor={editor} label="Add trip photos" />
        <EntryDetails editor={editor} used={["placeName"]} />
      </div> : <div className="writer-paper trip-day-page">
        <div className="day-page-heading"><span className="writer-kicker">{date ? experienceDate({ occurredOn: date }) : "No date added"}</span><button type="button" className="writer-text-button" onClick={() => setSelected("overview")}>{draft.title || "Name your trip"}</button></div>
        <h1>{number ? `Day ${number}` : date ? "A day on the journey" : "Undated notes"}</h1>
        {chapter && <TextField label="Chapter title" value={chapter.title} maxLength={160} onChange={(title) => change({ moments: draft.moments.map((item, index) => index === chapterIndex ? { ...item, title } : item) })} />}
        <WritingArea label="How the day unfolded" value={chapter?.body || ""} maxLength={20000} onChange={write} placeholder="Start with what you remember. The morning, a conversation, an unexpected detour…" />
        {chapter && <><MomentPhotos editor={editor} index={chapterIndex} /><details className="writer-small-details"><summary>Chapter details</summary><MomentEditor editor={editor} index={chapterIndex} onNotice={onNotice} /></details></>}
        <section className="trip-stops"><header><h2>Stops & little details</h2><p>Only add the parts you want to keep.</p></header>
          {draft.moments.map((moment, index) => (moment.momentDate || "") === date && index !== chapterIndex ? <MomentEditor key={moment.id || moment._key || index} editor={editor} index={index} variant="stop" onNotice={onNotice} /> : null)}
          <div className="trip-stop-actions">{[["RESTAURANT", "Meal"], ["STAY", "Stay"], ["ACTIVITY", "Activity"], ["JOURNEY", "Journey"], ["MEMORY", "Memory"]].map(([type, label]) => <AddMomentButton key={type} editor={editor} type={type} date={date} title={label} onNotice={onNotice}>{label}</AddMomentButton>)}</div>
        </section>
      </div>}
      <details className="trip-catchup"><summary>Just have quick notes? <span>Capture a moment or catch up in bullets</span></summary>
        <QuickMemoryCapture experience={draft} selectedDate={captureDate ?? (date || draft.startDate || "")} onDateChange={setCaptureDate}
          busy={editor.busy || editor.uncertainCreate} onCapture={editor.capture} onPendingChange={editor.setPendingCapture} />
      </details>
    </div>
  </div>;
}
