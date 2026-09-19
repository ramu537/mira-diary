import { Camera, Check, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { experienceApi } from "../../api/experiences";
import ExperienceImage from "../ExperienceImage";
import { Field, TextField } from "./WritingFields";

export function UploadQueue({ editor }) {
  if (!editor.uploads.length) return null;
  return <section className="writer-upload-queue" aria-label="Photo uploads">{editor.uploads.map((item) => <div key={item.key}>
    <span>{item.name}<small role="status">{item.status === "done" ? "Uploaded" : item.status === "uploading" ? "Uploading…" : item.status === "failed" ? item.error : "Waiting"}</small></span>
    {item.status === "failed" && <button type="button" disabled={editor.busy} onClick={() => editor.retryUpload(item)}>Retry</button>}
    <button type="button" disabled={editor.busy} aria-label={`Dismiss upload ${item.name}`} onClick={() => editor.dismissUpload(item.key)}><X size={16} /></button>
  </div>)}</section>;
}

export function AddPhotos({ editor, momentIndex = null, label = "Add photos" }) {
  const input = useRef(null);
  return <><button type="button" className="writer-text-button" disabled={editor.busy || editor.uncertainCreate || editor.draft.media.length >= 30}
    onClick={() => input.current?.click()}><Camera size={17} />{label}</button>
    <input hidden ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
      const files = Array.from(event.target.files || []); event.target.value = "";
      if (files.length) void editor.capture([], files, null, momentIndex);
    }} /></>;
}

export function MomentPhotos({ editor, index }) {
  const moment = editor.draft.moments[index];
  const images = moment?.id ? editor.draft.media.filter((image) => image.momentId === moment.id) : [];
  return <div className="moment-photo-shelf">{!!images.length && <div>{images.map((image) => <ExperienceImage key={image.id} experienceId={editor.draft.id} media={image} />)}</div>}
    <AddPhotos editor={editor} momentIndex={index} /></div>;
}

export default function PhotoPanel({ editor }) {
  const { draft, change } = editor;
  const patch = (id, value) => change({ media: draft.media.map((image) => image.id === id ? { ...image, ...value } : image) });
  return <details className="writer-details writer-photo-panel"><summary>Photos <span>{draft.media.length}/30</span></summary><div className="writer-details__body">
    <div className="writer-photo-intro"><p>JPEG, PNG or WebP · up to 5 MB each</p><AddPhotos editor={editor} /></div>
    <div className="writer-photo-grid">{draft.media.map((image) => <article key={image.id}>
      <ExperienceImage experienceId={draft.id} media={image} />
      <div className="writer-photo-actions"><button type="button" onClick={() => editor.mediaAction((id) => experienceApi.setCover(id, image.id))}>
        {draft.coverMediaId === image.id ? <><Check size={14} />Cover</> : "Use as cover"}</button>
        <button type="button" aria-label="Delete photo" onClick={() => {
          if (window.confirm("Delete this photo? Exclude it from any shared snapshot first.")) void editor.mediaAction((id) => experienceApi.removeMedia(id, image.id));
        }}><Trash2 size={16} /></button></div>
      <TextField label="Caption" value={image.caption} maxLength={300} onChange={(caption) => patch(image.id, { caption })} />
      <details><summary>Photo details</summary><TextField label="Description for accessibility" value={image.altText} maxLength={300} onChange={(altText) => patch(image.id, { altText })} />
        <Field label="Place in the story"><select value={image.momentId || ""} onChange={(event) => patch(image.id, { momentId: event.target.value ? Number(event.target.value) : null })}>
          <option value="">Whole experience</option>{draft.moments.filter((item) => item.id).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
        </select></Field></details>
    </article>)}</div>
    {!draft.media.length && <p className="writer-muted">Photos are optional. Your words can tell the whole story.</p>}
  </div></details>;
}
