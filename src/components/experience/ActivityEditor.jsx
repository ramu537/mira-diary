import EntryDetails from "./EntryDetails";
import MomentEditor, { AddMomentButton } from "./MomentEditor";
import { DateField, EntryTitle, TextField, Verdict, WritingArea } from "./WritingFields";

export default function ActivityEditor({ editor, onNotice }) {
  const { draft, change } = editor;
  return <div className="writer-paper activity-editor">
    <span className="writer-kicker">Activity journal</span><EntryTitle value={draft.title} onChange={(title) => change({ title })} placeholder="What did you do?" />
    <div className="writer-field-grid"><DateField label="When" value={draft.occurredOn} onChange={(occurredOn) => change({ occurredOn })} />
      <TextField label="Where" value={draft.placeName} onChange={(placeName) => change({ placeName })} placeholder="Place or venue" /></div>
    <WritingArea compact={!draft.story && draft.moments.length > 0} label="The experience" value={draft.story} onChange={(story) => change({ story })} placeholder="What was it like to be there?"
      prompts={["The best part?", "Something unexpected?", "What would you do differently?"]} />
    <WritingArea compact label="Good to know before going" value={draft.summary} maxLength={600} onChange={(summary) => change({ summary })} placeholder="What to bring, when to go, or a useful tip…" />
    <Verdict label="Would you do it again?" value={draft.recommendation} onChange={(recommendation) => change({ recommendation })} />
    <details className="writer-details" open={!draft.story.trim() && draft.moments.length > 0 || undefined}><summary>Highlights <span>{draft.moments.length || "Optional"}</span></summary><div className="writer-details__body">
      {draft.moments.map((moment, index) => <MomentEditor key={moment.id || moment._key || index} editor={editor} index={index} onNotice={onNotice} />)}
      <AddMomentButton editor={editor} type="ACTIVITY" date={draft.occurredOn} onNotice={onNotice}>Add a highlight</AddMomentButton>
    </div></details>
    <EntryDetails editor={editor} used={["placeName", "summary", "recommendation"]} />
  </div>;
}
