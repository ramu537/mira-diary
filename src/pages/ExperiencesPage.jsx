import { Archive, ArrowRight, Globe2, Image as ImageIcon, LockKeyhole, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExperienceImage from "../components/ExperienceImage";
import { experienceDate, experienceTypes, typeDetails } from "../lib/experiences";

function ExperienceCard({ item, onOpen }) {
  const details = typeDetails(item.experienceType);
  const Icon = details.icon;
  const cover = item.media?.find((media) => media.id === item.coverMediaId) || item.media?.[0];
  return <button className={`experience-card experience-tone--${details.tone}`} type="button" onClick={onOpen}>
    <span className="experience-card__visual">
      {cover ? <ExperienceImage experienceId={item.id} media={cover} /> : <span className="experience-card__placeholder"><Icon size={28} /><i /></span>}
      <span className="experience-type-pill"><Icon size={14} />{details.label}</span>
      <span className={`visibility-pill visibility-pill--${item.visibility.toLowerCase()}`}>{item.visibility === "PRIVATE" ? <LockKeyhole size={13} /> : <Globe2 size={13} />}{item.visibility.toLowerCase()}</span>
    </span>
    <span className="experience-card__body">
      <span className="experience-card__meta">{experienceDate(item)}{item.placeName ? ` · ${item.placeName}` : ""}</span>
      <strong>{item.title}</strong>
      <span>{item.summary || item.subtitle || "A memory waiting for its fuller story."}</span>
      <small><span>{item.moments?.length || 0} moments</span><span>{item.media?.length || 0} photos</span><ArrowRight size={16} /></small>
    </span>
  </button>;
}

export default function ExperiencesPage({ manager }) {
  const navigate = useNavigate();
  const [type, setType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const items = useMemo(() => manager.experiences.filter((item) => {
    const matchesState = archived ? item.state === "ARCHIVED" : item.state !== "ARCHIVED";
    const matchesType = type === "ALL" || item.experienceType === type;
    const haystack = `${item.title} ${item.subtitle} ${item.summary} ${item.story} ${item.placeName} ${(item.tags || []).join(" ")}`.toLowerCase();
    return matchesState && matchesType && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  }), [archived, manager.experiences, search, type]);

  return <div className="page-stack experiences-page">
    <header className="experience-hero panel">
      <div><span className="eyebrow"><Sparkles size={14} />Your lived library</span><h1>Keep the whole experience.</h1><p>Trips, films, food, activities, and the ordinary memories that deserve more than a camera roll.</p></div>
      <div className="experience-hero__actions"><button className="button button--ghost" type="button" onClick={() => navigate("/explore")}><Globe2 size={17} />Explore stories</button><button className="button button--primary" type="button" onClick={() => navigate("/experiences/new")}><Plus size={18} />New experience</button></div>
      <div className="experience-hero__stats"><span><strong>{manager.experiences.filter((item) => item.state !== "ARCHIVED").length}</strong>stories</span><span><strong>{manager.experiences.reduce((sum, item) => sum + (item.moments?.length || 0), 0)}</strong>moments</span><span><strong>{manager.experiences.filter((item) => item.visibility !== "PRIVATE").length}</strong>shared</span></div>
    </header>

    <section className="experience-toolbar" aria-label="Filter experiences">
      <div className="experience-tabs"><button className={type === "ALL" ? "is-active" : ""} type="button" onClick={() => setType("ALL")}>All</button>{experienceTypes.map((item) => <button key={item.value} className={type === item.value ? "is-active" : ""} type="button" onClick={() => setType(item.value)}>{item.label}</button>)}</div>
      <label className="search-field"><Search size={17} /><span className="sr-only">Search experiences</span><input type="search" placeholder="Search memories" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <button className={`archive-toggle ${archived ? "is-active" : ""}`} type="button" onClick={() => setArchived((value) => !value)}><Archive size={16} />{archived ? "Back to library" : "Archive"}</button>
    </section>

    {items.length ? <section className="experience-grid" aria-label="Experiences">{items.map((item) => <ExperienceCard key={item.id} item={item} onOpen={() => navigate(`/experiences/${item.id}`)} />)}</section> : <section className="experience-empty panel"><span><ImageIcon size={26} /></span><h2>{search ? "No memory matches that search" : archived ? "Your archive is empty" : "Start with something you still talk about"}</h2><p>{search ? "Try a place, title, tag, or a different phrase." : "Capture the shape of an experience now—the details, stops, feelings, and recommendations you will want later."}</p>{!search && !archived && <div>{experienceTypes.slice(0, 4).map((item) => { const Icon = item.icon; return <button key={item.value} type="button" onClick={() => navigate(`/experiences/new?type=${item.value}`)}><Icon size={17} />{item.label}</button>; })}</div>}</section>}
  </div>;
}
