import EntryDetails from "./EntryDetails";
import { AdditionalNotes } from "./MomentEditor";
import { DateField, EntryTitle, WritingArea } from "./WritingFields";

export default function MemoryEditor({ editor, onNotice }) {
  const { draft, change } = editor;
  return <div className="writer-paper memory-editor">
    <span className="writer-kicker">A personal memory</span><EntryTitle value={draft.title} onChange={(title) => change({ title })} placeholder="Give this memory a title" />
    <div className="memory-date"><DateField label="Date (optional)" value={draft.occurredOn} onChange={(occurredOn) => change({ occurredOn })} /></div>
    <WritingArea compact={!draft.story && draft.moments.length > 0} label="Your memory" value={draft.story} onChange={(story) => change({ story })} placeholder="Start anywhere. This is your space." />
    <AdditionalNotes editor={editor} onNotice={onNotice} />
    <EntryDetails editor={editor} />
  </div>;
}
