import { ChevronLeft, ChevronRight, Minus, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import TagEditor from "../components/TagEditor";
import { fullDate, shiftDate } from "../lib/dates";
import { diaryPrompts, moodDetails, moods, onThisDay, wordCount } from "../lib/diary";

export default function EntryPage({ entry, entries, selectedDate, today, saveState, deleting, onDateChange, onChange, onFlush, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const memories = onThisDay(entries, selectedDate);
  const words = wordCount(entry.content);
  const currentPromptIndex = diaryPrompts.indexOf(entry.prompt);

  function changeSleep(amount) {
    const current = Number(entry.sleepHours ?? 7);
    onChange({ sleepHours: Math.min(24, Math.max(0, Math.round((current + amount) * 2) / 2)) });
  }

  async function confirmDelete() {
    if (await onDelete(selectedDate)) setConfirmingDelete(false);
  }

  return <div className="page-stack entry-page">
    <section className="day-card panel">
      <header className="date-navigation"><button className="icon-button" type="button" onClick={() => onDateChange(shiftDate(selectedDate, -1))} aria-label="Previous day"><ChevronLeft size={20} /></button><div><span>{selectedDate === today ? "Today" : selectedDate}</span><h1>{fullDate(selectedDate)}</h1></div><button className="icon-button" type="button" disabled={selectedDate >= today} onClick={() => onDateChange(shiftDate(selectedDate, 1))} aria-label="Next day"><ChevronRight size={20} /></button>{selectedDate !== today && <button className="button button--small button--ghost jump-today" type="button" onClick={() => onDateChange(today)}>Jump to today</button>}<span className={`save-state save-state--${saveState.toLocaleLowerCase().replaceAll(" ", "-")}`} aria-live="polite"><i />{saveState}</span></header>
      <div className="check-in-grid">
        <fieldset className="mood-picker"><legend>How did this day feel?</legend><div>{moods.map((mood) => <button key={mood.value} type="button" className={entry.mood === mood.value ? "is-selected" : ""} style={{ "--mood-color": mood.token }} aria-pressed={entry.mood === mood.value} onClick={() => onChange({ mood: entry.mood === mood.value ? null : mood.value })}><i /><span>{mood.label}</span></button>)}</div></fieldset>
        <fieldset className="energy-picker"><legend>Energy {entry.energy ? <span>{entry.energy} / 5</span> : null}</legend><div>{[1, 2, 3, 4, 5].map((level) => <button key={level} type="button" className={level <= (entry.energy || 0) ? "is-filled" : ""} aria-label={`Energy ${level} of 5`} aria-pressed={entry.energy === level} onClick={() => onChange({ energy: entry.energy === level ? null : level })} />)}</div></fieldset>
        <fieldset className="sleep-picker"><legend>Sleep</legend><div><button type="button" onClick={() => changeSleep(-0.5)} aria-label="Decrease sleep"><Minus size={16} /></button><strong>{entry.sleepHours ?? "—"}<small>{entry.sleepHours == null ? "" : " h"}</small></strong><button type="button" onClick={() => changeSleep(0.5)} aria-label="Increase sleep"><Plus size={16} /></button></div></fieldset>
      </div>
      <label className="highlight-field"><Sparkles size={17} /><span className="sr-only">Day highlight</span><input maxLength="200" placeholder="The one thing worth remembering about this day…" value={entry.highlight} onChange={(event) => onChange({ highlight: event.target.value })} onBlur={onFlush} /></label>
    </section>

    <div className="writing-layout">
      <section className="reflection-column">
        <div className="prompt-card"><span>Reflection prompt</span><p>{entry.prompt}</p><button type="button" onClick={() => onChange({ prompt: diaryPrompts[(currentPromptIndex + 1 + diaryPrompts.length) % diaryPrompts.length] })}><RefreshCw size={15} />Another</button></div>
        <label className="writing-card panel"><span className="sr-only">Diary entry</span><textarea maxLength="100000" spellCheck="true" placeholder="Write the day as it happened. A few honest lines are enough." value={entry.content} onChange={(event) => onChange({ content: event.target.value })} onBlur={onFlush} /><footer><span>{words.toLocaleString()} {words === 1 ? "word" : "words"}</span><small>Saved privately through your existing diary service</small></footer></label>
      </section>
      <aside className="entry-sidebar">
        <section className="panel gratitude-card"><header><span>Notice the good</span><h2>Three good things</h2></header><div>{["gratitudeOne", "gratitudeTwo", "gratitudeThree"].map((field, index) => <label key={field}><span>{index + 1}</span><input maxLength="200" value={entry[field]} placeholder={index === 0 ? "Something small counts" : "Another good thing"} onChange={(event) => onChange({ [field]: event.target.value })} onBlur={onFlush} /></label>)}</div></section>
        <section className="panel tags-card"><header><span>Find it later</span><h2>Tags</h2></header><TagEditor key={entry.entryDate} tags={entry.tags || []} onChange={(tags) => onChange({ tags })} /></section>
        <section className="panel memories-card"><header><span>On this day</span><h2>Past entries</h2></header>{memories.length ? <div>{memories.slice(0, 3).map((memory) => { const mood = moodDetails(memory.mood); return <button type="button" key={memory.entryDate} onClick={() => onDateChange(memory.entryDate)} style={{ "--mood-color": mood?.token }}><span><i />{new Date(`${memory.entryDate}T12:00:00`).getFullYear()} · {mood?.label || "Unrated"}</span><strong>{memory.highlight || memory.content.slice(0, 95) || "A quiet entry"}</strong></button>; })}</div> : <p>Past entries from this date will appear here.</p>}</section>
        {entry.id && <button className="delete-entry" type="button" onClick={() => setConfirmingDelete(true)}><Trash2 size={16} />Delete this entry</button>}
      </aside>
    </div>
    <ConfirmDialog open={confirmingDelete} date={selectedDate} busy={deleting} onCancel={() => setConfirmingDelete(false)} onConfirm={confirmDelete} />
  </div>;
}

