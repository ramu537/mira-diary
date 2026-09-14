import { ArrowLeft, CalendarDays, Globe2, MapPin, Quote, Sparkles, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicExperienceApi } from "../api/experiences";
import ExperienceImage from "../components/ExperienceImage";
import { experienceDate, recommendationLabel, typeDetails } from "../lib/experiences";

function Stars({ value }) {
  if (!value) return null;
  return <span className="public-stars" aria-label={`${value} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < value ? "currentColor" : "none"} />)}</span>;
}

export default function PublicExperiencePage() {
  const { slug } = useParams();
  const [story, setStory] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); publicExperienceApi.get(slug).then(setStory).catch((next) => setError(next.message)); }, [slug]);
  if (error) return <div className="public-shell"><header className="public-nav"><Link to="/explore"><ArrowLeft size={16} />Stories</Link></header><main className="public-empty"><strong>This story is unavailable</strong><span>{error}</span></main></div>;
  if (!story) return <div className="public-shell"><main className="public-empty"><Sparkles className="spin" size={24} /><strong>Opening this story…</strong></main></div>;

  const details = typeDetails(story.experienceType);
  const TypeIcon = details.icon;
  const cover = story.media?.find((media) => media.id === story.coverMediaId) || story.media?.[0];
  const gallery = (story.media || []).filter((media) => media.id !== cover?.id && !media.momentId);
  const dates = story.startDate && story.endDate && story.startDate !== story.endDate
    ? `${experienceDate({ startDate: story.startDate })} — ${experienceDate({ startDate: story.endDate })}` : experienceDate(story);

  return <div className={`public-shell public-story experience-tone--${details.tone}`}>
    <header className="public-nav"><Link to="/explore"><span className="brand-mark"><Sparkles size={18} /></span><strong>Mira Stories</strong></Link><span><Globe2 size={14} />{story.visibility === "UNLISTED" ? "Shared by private link" : "Public story"}</span></header>
    <main>
      <article>
        <header className={`story-cover ${cover ? "has-image" : ""}`}>
          {cover && <ExperienceImage slug={slug} media={cover} eager />}
          <div className="story-cover__wash" />
          <div className="story-cover__copy"><span className="story-kicker"><TypeIcon size={16} />{details.label} experience</span><h1>{story.title}</h1>{story.subtitle && <p>{story.subtitle}</p>}<div><span><CalendarDays size={15} />{dates}</span>{story.placeName && <span><MapPin size={15} />{story.placeName}</span>}</div></div>
        </header>

        <div className="story-layout">
          <div className="story-main">
            {story.summary && <blockquote><Quote size={20} /><p>{story.summary}</p></blockquote>}
            {story.story && <section className="story-prose" aria-label="The story">{story.story.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>}
            {!!gallery.length && <section className={`story-gallery story-gallery--${Math.min(gallery.length, 3)}`} aria-label="Photo gallery">{gallery.map((media) => <figure key={media.id}><ExperienceImage slug={slug} media={media} /><figcaption>{media.caption}</figcaption></figure>)}</section>}
            {!!story.moments?.length && <section className="story-moments"><header><span>Moment by moment</span><h2>The experience, unfolded</h2></header><div>{story.moments.map((moment, index) => { const momentMedia = (story.media || []).filter((media) => media.momentId === moment.id && media.id !== cover?.id); return <article key={moment.id || index}><span className="moment-line"><i />{moment.dayNumber ? `Day ${moment.dayNumber}` : moment.momentType.toLowerCase()}</span><div><header><div>{moment.momentDate && <time>{experienceDate({ occurredOn: moment.momentDate })}</time>}<h3>{moment.title}</h3></div><Stars value={moment.rating} /></header>{moment.body && moment.body.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}{!!momentMedia.length && <div className="moment-photo-strip">{momentMedia.map((media) => <figure key={media.id}><ExperienceImage slug={slug} media={media} /><figcaption>{media.caption}</figcaption></figure>)}</div>}{(moment.placeName || moment.cost != null) && <footer>{moment.placeName && <span><MapPin size={14} />{moment.placeName}</span>}{moment.cost != null && <span>{moment.currency} {Number(moment.cost).toLocaleString("en-IN")}</span>}</footer>}</div></article>; })}</div></section>}
          </div>
          <aside className="story-facts">
            <div><span className="eyebrow">At a glance</span><Stars value={story.rating} />{story.recommendation && <strong>{recommendationLabel(story.recommendation)}</strong>}</div>
            {story.location && <div><span><MapPin size={15} />Place</span><strong>{story.location}</strong>{story.venue && <small>{story.venue}</small>}</div>}
            {story.companions && <div><span><Users size={15} />Shared with</span><strong>{story.companions}</strong></div>}
            {story.overallCost != null && <div><span>Experience cost</span><strong>{story.currency} {Number(story.overallCost).toLocaleString("en-IN")}</strong></div>}
            {!!story.tags?.length && <div className="story-tags">{story.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
          </aside>
        </div>
      </article>
      <footer className="story-footer"><Sparkles size={17} /><span>A personal experience preserved with Mira</span><Link to="/explore">Explore stories</Link></footer>
    </main>
  </div>;
}
