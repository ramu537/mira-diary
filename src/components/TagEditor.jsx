import { Plus, X } from "lucide-react";
import { useState } from "react";
import { sanitizeTags } from "../lib/diary";

export default function TagEditor({ tags, onChange }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  function add() {
    const candidate = draft.trim().replace(/^#/, "").toLocaleLowerCase();
    if (!candidate) return;
    if (!/^[a-z0-9][a-z0-9_-]{0,29}$/.test(candidate)) { setError("Use lowercase letters, numbers, hyphens, or underscores."); return; }
    if (tags.length >= 10 && !tags.includes(candidate)) { setError("An entry can have up to 10 tags."); return; }
    onChange(sanitizeTags([...tags, candidate])); setDraft(""); setError("");
  }
  function keyDown(event) {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); }
    if (event.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
  }
  return <div className="tag-editor"><div>{tags.map((tag) => <span key={tag}>#{tag}<button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} aria-label={`Remove ${tag} tag`}><X size={13} /></button></span>)}<label><span className="sr-only">Add a tag</span><input value={draft} maxLength="31" placeholder={tags.length ? "Add tag" : "Add tags"} onChange={(event) => { setDraft(event.target.value); setError(""); }} onKeyDown={keyDown} onBlur={add} /></label>{draft && <button className="tag-add" type="button" onMouseDown={(event) => event.preventDefault()} onClick={add} aria-label="Add tag"><Plus size={15} /></button>}</div>{error && <small role="alert">{error}</small>}</div>;
}

