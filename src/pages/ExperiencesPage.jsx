import { Archive, ArrowRight, Globe2, Image as ImageIcon, Link2, LockKeyhole, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExperienceImage from "../components/ExperienceImage";
import { experienceDate, experienceTypes, typeDetails } from "../lib/experiences";
import { memoryPassport } from "../lib/tripJournal";

function ExperienceCard({ item, onOpen }) {
  const details = typeDetails(item.experienceType);
  const Icon = details.icon;
  const cover = item.media?.find((media) => media.id === item.coverMediaId) || item.media?.[0];
  return <button className={`experience-card experience-tone--${details.tone}`} type="button" onClick={onOpen}>
    <span className="experience-card__visual">
      {cover ? <ExperienceImage experienceId={item.id} media={cover} /> : <span className="experience-card__placeholder"><Icon size={28} /><i /></span>}
      <span className="experience-type-pill"><Icon size={14} />{details.label}</span>
      <span className={`visibility-pill visibility-pill--${(item.visibility || "PRIVATE").toLowerCase()}`}>{item.visibility === "PUBLIC" ? <Globe2 size={13} /> : item.visibility === "UNLISTED" ? <Link2 size={13} /> : <LockKeyhole size={13} />}{item.visibility === "PUBLIC" ? "Public" : item.visibility === "UNLISTED" ? "Link-only" : "Private"}</span>
    </span>
    <span className="experience-card__body">
      <span className="experience-card__meta">{experienceDate(item)}{item.placeName ? ` · ${item.placeName}` : ""}</span>
      <strong>{item.title}</strong>
      <span>{item.summary || item.subtitle || item.moments?.[0]?.body || "A small moment is a story worth keeping."}</span>
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
    const haystack = `${item.title} ${item.subtitle} ${item.summary} ${item.story} ${item.placeName} ${(item.tags || []).join(" ")} ${(item.moments || []).map((moment) => `${moment.title} ${moment.body} ${moment.placeName}`).join(" ")}`.toLowerCase();
    return matchesState && matchesType && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  }), [archived, manager.experiences, search, type]);

  const resume = manager.experiences.find((item) => item.experienceType === "TRAVEL" && item.state !== "ARCHIVED");
  const resumeCover = resume && (resume.media?.find((item) => item.id === resume.coverMediaId) || resume.media?.[0]);
  return <div className="page-stack experiences-page">
    <header className="journal-library-heading"><div><span className="eyebrow">Your lived library</span><h1>Little moments. Whole stories.</h1><p>Keep it for yourself, or let someone see it through your eyes.</p></div><button className="button button--ghost" type="button" onClick={() => navigate("/explore")}><Globe2 size={17} />Explore stories</button></header>
    <section className="journal-start-grid">
      <div className={`journal-resume panel ${resumeCover ? "has-photo" : ""}`}>
        {resumeCover && <ExperienceImage experienceId={resume.id} media={resumeCover} eager />}
        <div><span className="eyebrow">{resume ? "Pick up where you left off" : "Your next chapter"}</span><h2>{resume?.title || "Where did the journey take you?"}</h2><p>{resume ? `${resume.moments?.length || 0} moments kept · ${memoryPassport(resume).filter((stamp) => stamp.earned).length} memory milestones` : "A trip name and one memory are enough to begin."}</p><button className="button button--primary" type="button" onClick={() => navigate(resume ? `/experiences/${resume.id}` : "/experiences/new?type=TRAVEL")}>{resume ? "Continue your trip" : "Start a trip"}<ArrowRight size={17} /></button></div>
      </div>
      <div className="journal-start-actions panel"><span className="eyebrow"><LockKeyhole size={14} />Private until you share</span><h2>What are we keeping?</h2>{experienceTypes.map((item) => { const Icon = item.icon; return <button key={item.value} type="button" onClick={() => navigate(`/experiences/new?type=${item.value}`)}><Icon size={20} /><span>{item.label === "Travel" ? "A trip or getaway" : `${item.label} experience`}</span><Plus size={16} /></button>; })}</div>
    </section>

    <section className="experience-toolbar" aria-label="Filter experiences">
      <div className="experience-tabs"><button className={type === "ALL" ? "is-active" : ""} type="button" onClick={() => setType("ALL")}>All</button>{experienceTypes.map((item) => <button key={item.value} className={type === item.value ? "is-active" : ""} type="button" onClick={() => setType(item.value)}>{item.label}</button>)}</div>
      <label className="search-field"><Search size={17} /><span className="sr-only">Search experiences</span><input type="search" placeholder="Search memories" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <button className={`archive-toggle ${archived ? "is-active" : ""}`} type="button" onClick={() => setArchived((value) => !value)}><Archive size={16} />{archived ? "Back to library" : "Archive"}</button>
    </section>

    {items.length ? <section className="experience-grid" aria-label="Experiences">{items.map((item) => <ExperienceCard key={item.id} item={item} onOpen={() => navigate(`/experiences/${item.id}`)} />)}</section> : <section className="experience-empty panel"><span><ImageIcon size={26} /></span><h2>{search ? "No memory matches that search" : archived ? "Your archive is empty" : "Start with something you still talk about"}</h2><p>{search ? "Try a place, title, tag, or a different phrase." : "Capture the shape of an experience now—the details, stops, feelings, and recommendations you will want later."}</p>{!search && !archived && <div>{experienceTypes.slice(0, 4).map((item) => { const Icon = item.icon; return <button key={item.value} type="button" onClick={() => navigate(`/experiences/new?type=${item.value}`)}><Icon size={17} />{item.label}</button>; })}</div>}</section>}
  </div>;
}
