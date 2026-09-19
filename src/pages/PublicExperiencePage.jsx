import { ArrowLeft, Globe2, Link2, Share2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicExperienceApi } from "../api/experiences";
import ExperienceStory from "../components/ExperienceStory";

export default function PublicExperiencePage() {
  const { slug } = useParams();
  const [state, setState] = useState({ slug: null, story: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  const [shareMessage, setShareMessage] = useState("");
  useEffect(() => {
    let active = true;
    setState({ slug, story: null, error: "" });
    setShareMessage("");
    publicExperienceApi.get(slug).then((story) => { if (active) setState({ slug, story, error: "" }); })
      .catch(() => { if (active) setState({ slug, story: null, error: "This story may have been made private or its link may no longer be valid." }); });
    return () => { active = false; };
  }, [slug, attempt]);
  const story = state.slug === slug ? state.story : null;
  async function share() {
    const url = `${window.location.origin}/shared/${encodeURIComponent(slug)}`;
    try {
      if (navigator.share) await navigator.share({ title: story.title, url });
      else { await navigator.clipboard.writeText(url); setShareMessage("Story link copied."); }
    } catch (error) {
      if (error.name !== "AbortError") setShareMessage("Use your browser’s address bar to copy this story link.");
    }
  }
  return <div className="public-shell journal-public">
    <header className="public-nav"><Link to="/explore"><ArrowLeft size={16} /><strong>Mira Stories</strong></Link>
      {story && <div className="public-share-actions"><span>{story.visibility === "UNLISTED" ? <Link2 size={15} /> : <Globe2 size={15} />}{story.visibility === "UNLISTED" ? "Anyone with this link" : "Public story"}</span><button type="button" className="writer-text-button" onClick={share}><Share2 size={16} />Share story</button></div>}</header>
    {shareMessage && <p className="public-share-feedback" role="status">{shareMessage}</p>}
    <main>{state.error && state.slug === slug ? <div className="public-empty"><h1>Story unavailable</h1><p>{state.error}</p><button className="button button--ghost" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : !story ? <div className="public-empty" role="status">Opening this story…</div> : <ExperienceStory story={story} slug={slug} />}
      <footer className="story-footer"><Sparkles size={17} /><span>A personal experience, shared with care</span><Link to="/explore">Explore stories</Link></footer></main>
  </div>;
}
