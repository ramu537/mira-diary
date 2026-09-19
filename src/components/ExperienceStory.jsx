import { CalendarDays, MapPin, Star } from "lucide-react";
import { useId } from "react";
import ExperienceImage from "./ExperienceImage";
import { experienceDate, recommendationLabel } from "../lib/experiences";
import { templateFor, wordCount } from "../lib/experienceTemplates";
import { groupMoments } from "../lib/tripJournal";

function Prose({ text }) {
  return <div className="reader-prose">{(text || "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}
function VerdictLine({ value }) {
  return <div className="reader-verdict">{value.rating != null && <span><Star size={16} fill="currentColor" />{value.rating}/5</span>}
    {value.recommendation && <span>{recommendationLabel(value.recommendation)}</span>}
    {value.cost != null && <span>{value.currency} {Number(value.cost).toLocaleString("en-IN")}</span>}</div>;
}
function Photos({ items, imageProps, cover = false }) {
  if (!items.length) return null;
  return <div className={cover ? "reader-cover" : "reader-photos"}>{items.map((image) => <figure key={image.id}>
    <ExperienceImage {...imageProps} media={image} eager={cover} />{image.caption && <figcaption>{image.caption}</figcaption>}
  </figure>)}</div>;
}
function Moment({ moment, media, imageProps, travel = false, dish = false }) {
  const label = { STAY: "Stay", RESTAURANT: "At the table", JOURNEY: "On the way", ACTIVITY: "Out & about", FOOD: "On the table", MOVIE: "Film notes", MEMORY: "A moment", DAY: "Day notes" }[moment.momentType];
  const automaticChapterTitle = travel && moment.momentType === "DAY" && (/^Day \d+$/.test(moment.title) || moment.title === moment.momentDate || moment.title === "Undated notes");
  return <section className={`reader-moment ${dish ? "reader-dish" : ""} ${travel && moment.momentType !== "DAY" ? "reader-stop" : ""}`}>
    {moment.momentType !== "DAY" && <span className="reader-kicker">{label || "Notes"}</span>}
    {!automaticChapterTitle && <h3>{moment.title}</h3>}
    {(moment.placeName || moment.location) && <p className="reader-place"><MapPin size={14} />{[moment.placeName, moment.location].filter(Boolean).join(" · ")}</p>}
    {(automaticChapterTitle || moment.body !== moment.title) && <Prose text={moment.body} />}
    <Photos items={media.filter((image) => moment.id != null && image.momentId === moment.id)} imageProps={imageProps} />
    <VerdictLine value={moment} />
  </section>;
}
export default function ExperienceStory({ story, experienceId, slug }) {
  const anchor = useId().replace(/:/g, "");
  const template = templateFor(story.experienceType), travel = story.experienceType === "TRAVEL", food = story.experienceType === "FOOD";
  const images = story.media || [], moments = story.moments || [], imageProps = { experienceId, slug };
  const cover = images.find((image) => image.id === story.coverMediaId) || images[0];
  const rest = images.filter((image) => image.id !== cover?.id);
  const ids = new Set(moments.map((item) => item.id).filter((id) => id != null));
  const loose = rest.filter((image) => !image.momentId || !ids.has(image.momentId));
  const groups = groupMoments(story);
  const words = wordCount([story.story, story.summary, ...moments.map((item) => item.body)].filter(Boolean).join(" "));
  const tips = travel ? moments.filter((item) => item.recommendation && item.momentType !== "DAY") : [];
  return <article className={`journal-reader reader-${template.route}`}>
    <header className="reader-heading"><span className="reader-kicker">{travel ? "Travel journal" : template.name + " journal"}</span>
      <h1>{story.title || "Untitled"}</h1>{story.subtitle && <p className="reader-subtitle">{story.subtitle}</p>}
      <div className="reader-byline">{(story.startDate || story.occurredOn) && <span><CalendarDays size={15} />{experienceDate(story)}{story.endDate && story.endDate !== story.startDate ? ` — ${experienceDate({ startDate: story.endDate })}` : ""}</span>}
        {story.placeName && <span><MapPin size={15} />{story.placeName}</span>}{words > 200 && <span>{Math.ceil(words / 220)} min read</span>}</div>
      {!travel && <VerdictLine value={{ ...story, cost: null }} />}
    </header>
    {cover && <Photos items={[cover]} imageProps={imageProps} cover />}
    <div className={travel && groups.length ? "reader-trip-layout" : "reader-single-layout"}>
      {travel && !!groups.length && <nav className="reader-contents" aria-label="Trip chapters"><span>In this journal</span>
        {story.story && <a href={`#${anchor}-intro`}>The beginning</a>}
        {groups.map((group, index) => <a key={group.date || "undated"} href={`#${anchor}-chapter-${index}`}><strong>{group.day ? `Day ${group.day}` : group.date ? "Chapter" : "Undated"}</strong>{group.date && <small>{experienceDate({ occurredOn: group.date })}</small>}</a>)}
        {!!tips.length && <a href={`#${anchor}-tips`}>Worth knowing</a>}
      </nav>}
      <div className="reader-text">
        {travel && story.summary && <p className="reader-lead">{story.summary}</p>}
        <section id={`${anchor}-intro`}><Prose text={story.story} /></section>
        <Photos items={loose} imageProps={imageProps} />
        {travel ? groups.map((group, index) => <section className="reader-chapter" id={`${anchor}-chapter-${index}`} key={group.date || "undated"}>
          <header><span>{group.day ? String(group.day).padStart(2, "0") : String(index + 1).padStart(2, "0")}</span><div><h2>{group.day ? `Day ${group.day}` : group.date ? "A day on the journey" : "More memories"}</h2>{group.date && <time dateTime={group.date}>{experienceDate({ occurredOn: group.date })}</time>}</div></header>
          {group.moments.map((moment, i) => <Moment key={moment.id || i} moment={moment} media={rest} imageProps={imageProps} travel />)}
        </section>) : <>
          {!!moments.length && <section className="reader-extra-notes"><h2>{food ? "What we ordered" : story.experienceType === "ACTIVITY" ? "Highlights" : "More notes"}</h2>
            {moments.map((moment, index) => <Moment key={moment.id || index} moment={moment} media={rest} imageProps={imageProps} dish={food && ["FOOD", "RESTAURANT"].includes(moment.momentType)} />)}
          </section>}
          {story.summary && <section className="reader-takeaway"><span className="reader-kicker">{food ? "Next time, order…" : story.experienceType === "ACTIVITY" ? "Good to know" : story.experienceType === "MOVIE" ? "The verdict" : "Worth remembering"}</span><Prose text={story.summary} /></section>}
        </>}
        {!!tips.length && <section className="reader-recommendations" id={`${anchor}-tips`}><h2>Worth knowing</h2>{tips.map((item, index) => <div key={item.id || index}><strong>{item.placeName || item.title}</strong><span>{recommendationLabel(item.recommendation)}</span></div>)}</section>}
        <footer className="reader-facts">{travel && <VerdictLine value={{ ...story, cost: null }} />}
          {story.location && <span>{story.location}</span>}{story.venue && <span>{story.venue}</span>}{story.companions && <span>With {story.companions}</span>}
          {story.overallCost != null && <span>Total: {story.currency} {Number(story.overallCost).toLocaleString("en-IN")}</span>}
          {story.category && <span>{story.category}</span>}{(story.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}
        </footer>
      </div>
    </div>
  </article>;
}
