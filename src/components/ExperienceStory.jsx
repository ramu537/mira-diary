import { CalendarDays, MapPin, Star } from "lucide-react";
import ExperienceImage from "./ExperienceImage";
import { experienceDate, recommendationLabel, typeDetails } from "../lib/experiences";
import { groupMoments } from "../lib/tripJournal";

export default function ExperienceStory({ story, experienceId, slug }) {
  const imageProps = { experienceId, slug };
  const media = story.media || [];
  const cover = media.find((item) => item.id === story.coverMediaId) || media[0];
  const groups = groupMoments(story);
  const momentIds = new Set((story.moments || []).map((item) => item.id));
  const gallery = media.filter((item) => item.id !== cover?.id && (!item.momentId || !momentIds.has(item.momentId)));
  const paragraphs = (text) => (text || "").split(/\n{2,}/).filter(Boolean).map((line, i) => <p key={i}>{line}</p>);
  const photos = (items) => <div className="scrapbook-photo-grid">{items.map((item) => <figure key={item.id}>
    <ExperienceImage {...imageProps} media={item} /><figcaption>{item.caption}</figcaption>
  </figure>)}</div>;
  return <article className="scrapbook-story">
    <header className={`scrapbook-cover ${cover ? "has-photo" : ""}`}>
      {cover && <ExperienceImage {...imageProps} media={cover} eager />}
      <div><span className="eyebrow">{typeDetails(story.experienceType).label} journal</span><h1>{story.title}</h1>
        {story.subtitle && <p>{story.subtitle}</p>}
        <div className="scrapbook-meta">{(story.startDate || story.occurredOn) && <span><CalendarDays size={16} />{experienceDate(story)}{story.endDate && story.endDate !== story.startDate ? ` — ${experienceDate({ startDate: story.endDate })}` : ""}</span>}
          {story.placeName && <span><MapPin size={16} />{story.placeName}</span>}</div></div>
    </header>
    <div className="scrapbook-reading">
      {cover?.caption && <p className="scrapbook-cover-caption">{cover.caption}</p>}
      {story.summary && <blockquote>{story.summary}</blockquote>}
      {story.story && <section className="scrapbook-prose" aria-label="The story">{paragraphs(story.story)}</section>}
      {!!gallery.length && photos(gallery)}
      {!!groups.length && <nav className="story-day-nav" aria-label="Story chapters">{groups.map((group, index) => <a key={group.date || "undated"} href={`#story-day-${index}`}>{group.day ? `Day ${group.day}` : group.date || "Undated"}</a>)}</nav>}
      {groups.map((group, index) => <section className="scrapbook-day" id={`story-day-${index}`} key={group.date || "undated"}>
        <header><span>{group.day ? `Day ${String(group.day).padStart(2, "0")}` : group.date ? "A day to remember" : "More memories"}</span>
          {group.date && <time dateTime={group.date}>{experienceDate({ occurredOn: group.date })}</time>}</header>
        {group.moments.map((moment, i) => <article className="scrapbook-moment" key={moment.id || i}>
          <small>{moment.momentType.toLowerCase()}</small><h3>{moment.title}</h3>
          {moment.body !== moment.title && paragraphs(moment.body)}
          {(moment.placeName || moment.location) && <p className="scrapbook-place"><MapPin size={15} />{[moment.placeName, moment.location].filter(Boolean).join(" · ")}</p>}
          {photos(media.filter((item) => item.momentId === moment.id && item.id !== cover?.id))}
          <div className="scrapbook-meta">{moment.rating && <span><Star size={15} />{moment.rating}/5</span>}{moment.recommendation && <span>{recommendationLabel(moment.recommendation)}</span>}{moment.cost != null && <span>{moment.currency} {Number(moment.cost).toLocaleString("en-IN")}</span>}</div>
        </article>)}
      </section>)}
      <section className="scrapbook-facts" aria-label="Experience details">
        {story.rating && <span><Star size={16} />{story.rating}/5</span>}{story.recommendation && <span>{recommendationLabel(story.recommendation)}</span>}
        {story.location && <span>{story.location}</span>}{story.venue && <span>{story.venue}</span>}{story.companions && <span>With {story.companions}</span>}
        {story.overallCost != null && <span>{story.currency} {Number(story.overallCost).toLocaleString("en-IN")}</span>}
        {story.category && <span>{story.category}</span>}{(story.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}
      </section>
    </div>
  </article>;
}
