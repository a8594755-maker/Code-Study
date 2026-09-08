import { useEffect } from "react";

export function PageHeading({ title, description, children }) {
  return <header className="app-page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="app-page-actions">{children}</div>}</header>;
}

export function WorkspaceToolbar({ title, context, pane, onPane, onMenu, menuOpen, menuId, menuLabel, learnLabel = "本題講解", workLabel = "寫程式", failed = false }) {
  return <header className="studio-activity-header">
    <button className="studio-open-course" aria-expanded={menuOpen} aria-controls={menuId} onClick={onMenu}>☰ {menuLabel}</button>
    <div className="studio-activity-title">{context && <span>{context}</span>}<h1 title={title}>{title}</h1></div>
    <div className="studio-tabs" role="tablist" aria-label="活動頁籤">
      {learnLabel && <button role="tab" aria-selected={pane === "learn"} onClick={() => onPane("learn")}>{learnLabel}</button>}
      <button role="tab" aria-selected={pane === "work"} onClick={() => onPane("work")}>{workLabel}</button>
      <button role="tab" aria-selected={pane === "results"} onClick={() => onPane("results")}>執行結果{failed ? " · 待修正" : ""}</button>
      <button className="studio-tutor-tab" role="tab" aria-selected={pane === "tutor"} onClick={() => onPane("tutor")}>問家教</button>
    </div>
  </header>;
}

export function useDrawerFocus(open, element, close) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement, drawer = element.current;
    drawer?.querySelector("button")?.focus();
    function keydown(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const controls = [...drawer.querySelectorAll('button:not(:disabled), input, summary, [tabindex="0"]')].filter((el) => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    drawer?.addEventListener("keydown", keydown);
    return () => { drawer?.removeEventListener("keydown", keydown); if (previous?.isConnected) previous.focus(); };
  }, [open, element]);
}
