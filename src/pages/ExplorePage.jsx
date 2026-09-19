import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicExperienceApi } from "../api/experiences";
import ExperienceImage from "../components/ExperienceImage";
import { experienceDate, typeDetails } from "../lib/experiences";

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    publicExperienceApi.list(18).then((next) => { if (active) setItems(next); })
      .catch(() => { if (active) setError("Stories could not be loaded. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <div className="public-shell explore-page">
    <header className="public-nav"><Link to="/"><span className="brand-mark"><Sparkles size={18} /></span><strong>Mira Stories</strong></Link><Link to="/">My experiences</Link></header>
    <main><header className="explore-heading"><span><Compass size={17} />Shared experiences</span><h1>Real moments, kept with care.</h1><p>Personal stories people chose to make discoverable—told as experiences, not ratings alone.</p></header>
      {loading ? <p role="status">Loading stories…</p> : error ? <div className="public-error" role="alert">{error}<button type="button" className="button button--ghost" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div> : items.length ? <div className="explore-grid">{items.map((item) => { const details = typeDetails(item.experienceType); const Icon = details.icon; const cover = item.media?.find((media) => media.id === item.coverMediaId) || item.media?.[0]; return <Link className={`explore-card experience-tone--${details.tone}`} to={`/shared/${item.slug}`} key={item.slug}>{cover ? <ExperienceImage slug={item.slug} media={cover} /> : <span className="explore-card__blank"><Icon size={26} /></span>}<span><small>{details.label} · {experienceDate(item)}</small><strong>{item.title}</strong><p>{item.summary || item.subtitle}</p><em>Read story <ArrowRight size={15} /></em></span></Link>; })}</div> : <div className="public-empty"><Sparkles size={24} /><strong>No public stories yet</strong><span>Stories shared publicly will gather here.</span></div>}
    </main>
  </div>;
}
