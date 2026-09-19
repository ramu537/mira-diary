import { useEffect, useRef } from "react";

export default function LeaveExperienceDialog({ blocker, busy }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (!dialog.current.open) dialog.current.showModal();
    } else dialog.current.close();
  }, [blocker.state]);
  return <dialog ref={dialog} className="sharing-dialog leave-experience-dialog" aria-labelledby="leave-title"
    onCancel={(event) => { event.preventDefault(); if (blocker.state === "blocked") blocker.reset(); }}>
    <h2 id="leave-title">{busy ? "Your memory is being saved" : "Leave unsaved work?"}</h2>
    <p>{busy ? "Please wait for the current save or upload to finish." : "Unfinished capture text, unsaved edits and pending photos will be lost. Saved memories will stay in your library."}</p>
    <footer><button autoFocus className="button button--primary" type="button" onClick={() => blocker.reset()}>Stay here</button>
      <button className="button button--ghost" type="button" disabled={busy} onClick={() => blocker.proceed()}>Leave experience</button></footer>
  </dialog>;
}
