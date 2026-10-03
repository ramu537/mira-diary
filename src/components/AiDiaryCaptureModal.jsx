import AiCaptureDialog from "./AiCaptureDialog";

export default function AiDiaryCaptureModal(props) {
  return <AiCaptureDialog {...props} targetDomain={props.targetDomain || "DIARY"}
    title="Capture a memory"
    description="Keep a moment or describe your trip. Private until you choose to share."
    placeholder="Day 1 in Kerala: reached Kochi, stopped for lunch, checked into our stay. The sunset was the best part…"
    label="What would you like to remember?"
    imageLabel="Add photos from the experience"
    dated={true} />;
}
