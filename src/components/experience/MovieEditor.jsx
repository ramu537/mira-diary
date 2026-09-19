import EntryDetails from "./EntryDetails";
import { AdditionalNotes } from "./MomentEditor";
import { DateField, EntryTitle, Rating, TextField, Verdict, WritingArea } from "./WritingFields";

export default function MovieEditor({ editor, onNotice }) {
  const { draft, change } = editor;
  return <div className="writer-paper movie-editor">
    <span className="writer-kicker">Film journal</span><EntryTitle value={draft.title} onChange={(title) => change({ title })} placeholder="Film title" />
    <div className="movie-log-line"><DateField label="Watched on" value={draft.occurredOn} onChange={(occurredOn) => change({ occurredOn })} />
      <Rating value={draft.rating} onChange={(rating) => change({ rating })} /></div>
    <WritingArea compact={!draft.story && draft.moments.length > 0} label="Your review" value={draft.story} onChange={(story) => change({ story })} placeholder="What stayed with you after the credits?"
      prompts={["What worked for you?", "A performance that stood out?", "How did it leave you feeling?"]} />
    <div className="writer-field-grid"><TextField label="One-line verdict" value={draft.summary} maxLength={600} onChange={(summary) => change({ summary })} />
      <Verdict label="Worth watching?" value={draft.recommendation} onChange={(recommendation) => change({ recommendation })} /></div>
    <TextField label="Cinema or streaming service (optional)" value={draft.venue} onChange={(venue) => change({ venue })} placeholder="Where did you watch it?" />
    <AdditionalNotes editor={editor} onNotice={onNotice} />
    <EntryDetails editor={editor} used={["summary", "venue", "rating", "recommendation"]} />
  </div>;
}
