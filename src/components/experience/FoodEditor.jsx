import EntryDetails from "./EntryDetails";
import MomentEditor, { AddMomentButton } from "./MomentEditor";
import { DateField, EntryTitle, Rating, TextField, Verdict, WritingArea } from "./WritingFields";

export default function FoodEditor({ editor, onNotice }) {
  const { draft, change } = editor;
  return <div className="writer-paper food-editor">
    <span className="writer-kicker">Food journal</span><EntryTitle value={draft.title} onChange={(title) => change({ title })} placeholder="Restaurant or meal" />
    <div className="writer-field-grid"><DateField label="Visited on" value={draft.occurredOn} onChange={(occurredOn) => change({ occurredOn })} />
      <TextField label="Branch or neighbourhood" value={draft.placeName} onChange={(placeName) => change({ placeName })} placeholder="Which place was it?" /></div>
    <WritingArea label="How was the meal?" value={draft.story} onChange={(story) => change({ story })} placeholder="The first bite, the atmosphere, the service…" />
    <section className="dish-notebook"><header><div><h2>What we ordered</h2><p>Keep the dishes you’d want to remember.</p></div>
      <AddMomentButton editor={editor} type="FOOD" date={draft.occurredOn} onNotice={onNotice}>Add a dish</AddMomentButton></header>
      {draft.moments.map((moment, index) => <MomentEditor key={moment.id || moment._key || index} editor={editor} index={index} variant={moment.momentType === "FOOD" || moment.momentType === "RESTAURANT" ? "dish" : "note"} onNotice={onNotice} />)}
    </section>
    <div className="writer-field-grid"><Rating label="Overall experience" value={draft.rating} onChange={(rating) => change({ rating })} /><Verdict label="Would you go back?" value={draft.recommendation} onChange={(recommendation) => change({ recommendation })} /></div>
    <TextField label="What to order next time" value={draft.summary} maxLength={600} onChange={(summary) => change({ summary })} placeholder="Your recommendation" />
    <EntryDetails editor={editor} used={["placeName", "rating", "recommendation", "summary"]} />
  </div>;
}
