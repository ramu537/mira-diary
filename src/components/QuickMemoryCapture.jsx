import { Camera, Check, Layers, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { captureKinds, memoryPrompts, quickMoments } from "../lib/tripJournal";

export default function QuickMemoryCapture({ experience, selectedDate, onDateChange, busy, onCapture, onPendingChange }) {
  const [kind, setKind] = useState(experience.experienceType === "MOVIE" ? "MOVIE" : experience.experienceType === "FOOD" ? "RESTAURANT" : experience.experienceType === "ACTIVITY" ? "ACTIVITY" : "MEMORY");
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [batch, setBatch] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const input = useRef(null), fileInput = useRef(null);
  const hint = captureKinds.find(([value]) => value === kind)?.[2] || "What do you want to remember?";
  const lines = useMemo(() => text.split(/\r?\n/).map((line) => line.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean), [text]);
  useEffect(() => { onPendingChange(Boolean(text.trim() || files.length)); }, [text, files.length, onPendingChange]);
  async function submit(event) {
    event.preventDefault(); setError("");
    try {
      if (batch && files.length) throw new Error("Save your catch-up notes first, then attach photos to individual moments.");
      const note = text.trim() || (files.length ? "Photo memories" : "");
      const moments = quickMoments({ text: note, kind, date: selectedDate, experience, batch });
      const result = await onCapture(moments, files);
      if (result) { setText(""); setFiles([]); setPrompt(""); if (fileInput.current) fileInput.current.value = ""; input.current?.focus(); }
    } catch (failure) { setError(failure.message); }
  }
  return <section className="quick-memory panel" id="capture-memory">
    <header><div><span className="eyebrow">A little now. A story to return to.</span><h2>Capture a moment</h2></div><span className="private-capture-label"><Check size={14} />Private capture</span></header>
    <form onSubmit={submit}><fieldset disabled={busy}><legend className="sr-only">Quick memory</legend>
      <div className="capture-kinds" aria-label="Moment kind">{captureKinds.map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} className={kind === value ? "is-selected" : ""} onClick={() => setKind(value)}>{label}</button>)}</div>
      <label className="capture-date">Save under<input aria-label="Moment date" type="date" min={experience.startDate || undefined} max={experience.endDate || undefined} value={selectedDate} onChange={(event) => onDateChange(event.target.value)} /><small>{selectedDate ? "Change this for a past memory" : "Undated until you choose a day"}</small></label>
      <label className="sr-only" htmlFor="quick-memory-text">{batch ? "One memory per line" : "Your memory"}</label>
      <textarea id="quick-memory-text" ref={input} value={text} onChange={(event) => setText(event.target.value)} maxLength={20000} rows={batch ? 6 : 3} aria-describedby={prompt ? "capture-prompt" : undefined} placeholder={batch ? "One memory per line. All will use the selected date.\nBreakfast at the café—loved the appam\nWalked by the backwaters at sunset" : prompt || hint} />
      <div className="memory-prompts">{memoryPrompts.slice(0, 4).map((question) => <button type="button" key={question} aria-pressed={prompt === question} onClick={() => { setPrompt(question); input.current?.focus(); }}>{question}</button>)}</div>
      {prompt && <p id="capture-prompt" className="journal-hint">Writing prompt: {prompt} Only your own words will be saved.</p>}
      {batch && !!lines.length && <div className="capture-review"><strong>Review {lines.length} {lines.length === 1 ? "moment" : "moments"}</strong><ol>{lines.map((line, index) => <li key={index}>{line}</li>)}</ol><small>Only these words will be saved. No extra story is generated.</small></div>}
      {!!files.length && <ul className="capture-files">{files.map((file, index) => <li key={`${file.name}-${index}`}><Camera size={15} /><span>{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((values) => values.filter((_, i) => i !== index))}><X size={15} /></button></li>)}</ul>}
      {error && <p role="alert" className="journal-error">{error}</p>}
      <footer><input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" ref={fileInput} onChange={(event) => { setFiles((values) => [...values, ...event.target.files]); event.target.value = ""; }} />
        {!batch && <button type="button" className="button button--ghost" onClick={() => fileInput.current?.click()}><Camera size={17} />Add photos</button>}
        <button type="button" className="capture-mode" aria-pressed={batch} onClick={() => { if (!files.length) setBatch(!batch); else setError("Remove the selected photos before switching to catch-up notes."); }}><Layers size={16} />{batch ? "Single moment" : "Catch up in bullets"}</button>
        <button className="button button--primary" disabled={!text.trim() && !files.length} type="submit"><Plus size={17} />{busy ? "Saving…" : batch ? "Save reviewed moments" : "Save moment"}</button></footer>
    </fieldset></form>
  </section>;
}
