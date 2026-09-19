import { Star } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { recommendations } from "../../lib/experiences";
import { wordCount } from "../../lib/experienceTemplates";

export function Field({ label, children, className = "" }) {
  return <label className={`writing-field ${className}`}><span>{label}</span>{children}</label>;
}

export function TextField({ label, value, onChange, maxLength = 180, ...props }) {
  return <Field label={label}><input value={value || ""} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} {...props} /></Field>;
}

export function DateField({ label, value, onChange, ...props }) {
  return <Field label={label}><input type="date" value={value || ""} onChange={(event) => onChange(event.target.value || null)} {...props} /></Field>;
}

export function WritingArea({ label, value, onChange, placeholder, maxLength = 100000, compact = false, prompts = [] }) {
  const ref = useRef(null), id = useId();
  const [prompt, setPrompt] = useState("");
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input) return;
    const resize = () => {
      if (!input.offsetWidth) return;
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
    };
    resize();
    // Also fit long writing when a collapsed section opens or Read switches back to Write.
    let width = input.offsetWidth;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      const nextWidth = input.offsetWidth;
      if (nextWidth !== width) { width = nextWidth; resize(); }
    });
    observer?.observe(input);
    window.addEventListener("resize", resize);
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [value, compact]);
  return <section className={`writing-area ${compact ? "writing-area--compact" : ""}`}>
    <header><label htmlFor={id}>{label}</label><span>{wordCount(value)} words</span></header>
    {!!prompts.length && <div className="writing-prompts" aria-label="Writing prompts">{prompts.map((text) => <button key={text} type="button" aria-pressed={prompt === text} onClick={() => { setPrompt(text); ref.current?.focus(); }}>{text}</button>)}</div>}
    {prompt && <small className="writing-prompt">{prompt}</small>}
    <textarea ref={ref} id={id} value={value || ""} onChange={(event) => onChange(event.target.value)} rows={compact ? 3 : 10}
      maxLength={maxLength} placeholder={prompt || placeholder} spellCheck />
  </section>;
}

export function EntryTitle({ value, onChange, placeholder }) {
  return <label className="writing-title"><span className="sr-only">{placeholder}</span><input value={value} maxLength={160}
    onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function Rating({ value, onChange, label = "Your rating" }) {
  return <fieldset className="writer-rating"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number}
    aria-label={`${number} out of 5 stars${number === value ? ", selected; click to clear" : ""}`} aria-pressed={number === value}
    onClick={() => onChange(value === number ? null : number)}><Star size={22} fill={number <= (value || 0) ? "currentColor" : "none"} /></button>)}<span>{value ? `${value}/5` : "Optional"}</span></div></fieldset>;
}

export function Verdict({ value, onChange, label = "Would you recommend it?" }) {
  return <Field label={label}><select value={value || ""} onChange={(event) => onChange(event.target.value || null)}>
    <option value="">No verdict yet</option>{recommendations.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select></Field>;
}
