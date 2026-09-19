import { Archive, ArrowRight, Globe2, Link2, LockKeyhole, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExperienceImage from "../components/ExperienceImage";
import { experienceDate, typeDetails } from "../lib/experiences";
import { entryExcerpt, experienceTemplates, newExperiencePath, templateFor } from "../lib/experienceTemplates";

export function ExperienceTypePicker({ compact = false }) {
  return <section className={compact ? "journal-create-strip" : "journal-type-picker"} aria-label="Choose what to write">
    {experienceTemplates.map((item) => {
      const Icon = typeDetails(item.type).icon;
      return <Link to={newExperiencePath(item.type)} key={item.type}><Icon size={20} /><span><strong>{compact ? item.name : item.action}</strong>{!compact && <small>{item.description}</small>}</span>{!compact && <ArrowRight size={17} />}</Link>;
    })}
  </section>;
}

export default function ExperiencesPage({ manager }) {
  const [type, setType] = useState("ALL"), [search, setSearch] = useState(""), [archived, setArchived] = useState(false);
  const items = useMemo(() => manager.experiences.filter((item) => {
    if ((item.state === "ARCHIVED") !== archived || (type !== "ALL" && item.experienceType !== type)) return false;
    const words = [item.title, item.subtitle, item.summary, item.story, item.placeName, item.venue, ...(item.tags || []), ...(item.moments || []).flatMap((moment) => [moment.title, moment.body, moment.placeName])].join(" ").toLowerCase();
    return words.includes(search.trim().toLowerCase());
  }), [manager.experiences, type, search, archived]);
  const resume = manager.experiences.find((item) => item.state !== "ARCHIVED");
  return <div className="journal-library">
    <header className="journal-library-bar"><div><h1>Your journal</h1><p>{manager.experiences.filter((item) => item.state !== "ARCHIVED").length} experiences kept</p></div><Link className="writer-text-button" to="/explore"><Globe2 size={17} />Explore stories</Link></header>
    <div className="journal-create-heading"><span>Write something new</span><span><LockKeyhole size={13} />Private by default</span></div>
    <ExperienceTypePicker compact />
    {resume && !search && !archived && type === "ALL" && <Link className="journal-continue" to={`/experiences/${resume.id}`}><span>Continue writing</span><strong>{resume.title}</strong><ArrowRight size={16} /></Link>}
    <div className="journal-library-tools"><nav aria-label="Filter journal by type"><button type="button" aria-pressed={type === "ALL"} onClick={() => setType("ALL")}>All entries</button>{experienceTemplates.map((item) => <button key={item.type} type="button" aria-pressed={type === item.type} onClick={() => setType(item.type)}>{item.plural}</button>)}</nav>
      <div><label className="journal-search"><Search size={17} /><span className="sr-only">Search journal</span><input type="search" placeholder="Search your journal" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <button type="button" className="writer-text-button" aria-pressed={archived} onClick={() => setArchived(!archived)}><Archive size={17} />{archived ? "Show active" : "Archive"}</button></div>
    </div>
    {items.length ? <div className="journal-entry-list">{items.map((item) => {
      const template = templateFor(item.experienceType), Icon = typeDetails(item.experienceType).icon;
      const cover = item.media?.find((image) => image.id === item.coverMediaId) || item.media?.[0];
      return <Link className="journal-entry-row" to={`/experiences/${item.id}`} key={item.id}>
        <div className="journal-entry-copy"><div className="journal-entry-meta"><span><Icon size={14} />{template.name}</span><span>{experienceDate(item)}</span><span>{item.visibility === "PUBLIC" ? <><Globe2 size={13} />Public</> : item.visibility === "UNLISTED" ? <><Link2 size={13} />Link-only</> : <><LockKeyhole size={13} />Private</>}</span></div>
          <h2>{item.title}</h2><p>{entryExcerpt(item) || "Open to start writing."}</p>
          <small>{[item.placeName, item.media?.length ? `${item.media.length} photos` : "", item.rating ? `${item.rating}/5` : ""].filter(Boolean).join(" · ")}</small></div>
        {cover && <ExperienceImage experienceId={item.id} media={cover} />}
        <ArrowRight className="journal-entry-arrow" size={18} />
      </Link>;
    })}</div> : <section className="journal-library-empty"><h2>{search ? "No matching entries" : archived ? "Nothing archived" : type === "ALL" ? "Your first page starts here." : `No ${templateFor(type).plural.toLowerCase()} yet.`}</h2>
      <p>{search ? "Try a title, place, or a few words from your writing." : "Choose a format above. A few lines are enough."}</p>
      {!search && !archived && <Link to={newExperiencePath(type === "ALL" ? "GENERAL" : type)} className="button button--primary">{type === "ALL" ? "Write a memory" : templateFor(type).action}<ArrowRight size={16} /></Link>}
    </section>}
  </div>;
}
