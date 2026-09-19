import { Award, Check } from "lucide-react";
import { useState } from "react";
import { memoryPassport } from "../lib/tripJournal";

export default function MemoryPassport({ saved }) {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem("mira.memoryPassport.hidden") === "true"; } catch { return false; }
  });
  const stamps = memoryPassport(saved);
  function toggle() {
    setHidden(!hidden);
    try { localStorage.setItem("mira.memoryPassport.hidden", String(!hidden)); } catch { /* Optional device preference. */ }
  }
  return <section className="memory-passport panel">
    <header><div><Award size={20} /><h2>Memory passport</h2></div><button type="button" onClick={toggle} aria-expanded={!hidden}>{hidden ? "Show" : "Hide"}</button></header>
    {!hidden && <><p>A few little milestones. Keep what matters; skip the rest.</p><div className="passport-stamps">{stamps.map((stamp) => <div className={stamp.earned ? "is-earned" : ""} key={stamp.key}>
      <span>{stamp.earned ? <Check size={19} /> : <Award size={19} />}</span><strong>{stamp.label}</strong><small>{stamp.earned ? "Preserved" : stamp.detail}</small>
    </div>)}</div><small>Based on saved memories. Private stories count just as much.</small></>}
  </section>;
}
