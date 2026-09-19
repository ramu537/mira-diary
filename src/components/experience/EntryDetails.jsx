import TagEditor from "../TagEditor";
import { sanitizeExperienceTags } from "../../lib/experiences";
import { Field, Rating, TextField, Verdict } from "./WritingFields";

export default function EntryDetails({ editor, used = [] }) {
  const { draft, change } = editor;
  const fields = [["subtitle", "Subtitle", 240], ["placeName", "Place", 180], ["venue", "Venue", 180],
    ["location", "Address or location", 300], ["companions", "With", 300], ["category", "Category", 100], ["summary", "One takeaway", 600]];
  return <details className="writer-details"><summary>More details <span>Optional</span></summary><div className="writer-details__body">
    <div className="writer-field-grid">{fields.filter(([key]) => !used.includes(key)).map(([key, label, maxLength]) => <TextField key={key} label={label} value={draft[key]} maxLength={maxLength} onChange={(value) => change({ [key]: value })} />)}</div>
    {!used.includes("rating") && <Rating value={draft.rating} onChange={(rating) => change({ rating })} />}
    {!used.includes("recommendation") && <Verdict value={draft.recommendation} onChange={(recommendation) => change({ recommendation })} />}
    <div className="writer-field-grid"><Field label="Total cost"><input type="number" min="0" step="0.01" value={draft.overallCost ?? ""} onChange={(event) => change({ overallCost: event.target.value })} /></Field>
      <TextField label="Currency" value={draft.currency} maxLength={3} onChange={(value) => change({ currency: value.toUpperCase() })} /></div>
    <TagEditor tags={draft.tags} max={12} sanitize={sanitizeExperienceTags} onChange={(tags) => change({ tags })} />
  </div></details>;
}
