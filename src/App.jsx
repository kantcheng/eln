import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "fieldnote-eln-v1";

const starterNotebooks = [
  { id: "cell-culture", name: "Cell culture", color: "mint", note: "Cellular models & assays" },
  { id: "protein-work", name: "Protein work", color: "lilac", note: "Expression & purification" },
  { id: "method-dev", name: "Method development", color: "peach", note: "Protocols in progress" },
];

const starterEntries = [
  {
    id: "exp-2418",
    title: "Optimizing seeding density for macrophage assay",
    notebookId: "cell-culture",
    status: "In progress",
    tags: ["cell assay", "optimization"],
    objective: "Identify a seeding density that gives a consistent response across the full 24-hour assay window.",
    materials: "THP-1 cells, RPMI + 10% FBS, PMA, 96-well clear-bottom plate, hemocytometer.",
    procedure: "Differentiated cells for 48 h with 50 nM PMA. Seeded at 20k, 40k, and 80k cells per well in triplicate. Allowed cells to rest overnight before adding stimulus.",
    results: "The 40k condition showed the most uniform monolayer. The 80k wells reached confluence before the final read; 20k wells had noticeably higher well-to-well variation.",
    conclusion: "Carry 40k cells per well forward to the cytokine pilot. Repeat with a second passage to check reproducibility.",
    createdAt: "2026-11-18T09:30:00.000Z",
    updatedAt: "2026-11-20T14:15:00.000Z",
  },
  {
    id: "exp-2417",
    title: "Small-scale expression test: construct B7",
    notebookId: "protein-work",
    status: "Reviewed",
    tags: ["expression", "construct B7"],
    objective: "Compare soluble expression of construct B7 at two induction temperatures.",
    materials: "E. coli BL21(DE3), LB + kanamycin, IPTG, lysis buffer, SDS-PAGE gels.",
    procedure: "Transformed a fresh colony into 5 mL starter culture. Inoculated 2 × 25 mL cultures, grew to OD600 0.6, induced with 0.5 mM IPTG, and expressed overnight at 18°C or 30°C.",
    results: "The 18°C sample had a stronger target-sized band in the soluble fraction. The 30°C pellet contained most of the visible target protein.",
    conclusion: "Use 18°C induction for the first purification trial. Save the 30°C pellet as a fallback.",
    createdAt: "2026-11-16T08:20:00.000Z",
    updatedAt: "2026-11-19T16:40:00.000Z",
  },
  {
    id: "exp-2416",
    title: "Calibrating the plate-reader kinetic method",
    notebookId: "method-dev",
    status: "Draft",
    tags: ["instrument", "kinetics"],
    objective: "Choose a read interval that captures the initial reaction rate without unnecessary instrument overhead.",
    materials: "Absorbance standard, clear 96-well plate, kinetic read method, temperature-controlled plate reader.",
    procedure: "Read the absorbance standard every 15, 30, and 60 seconds for 20 minutes at 25°C. Compared linearity and total run time across methods.",
    results: "The 30-second interval produced a smooth trace and completed quickly. The 60-second interval missed early curvature in the first two minutes.",
    conclusion: "Provisional method: 30-second reads for 20 minutes. Verify with a reaction sample before release.",
    createdAt: "2026-11-14T11:05:00.000Z",
    updatedAt: "2026-11-14T11:05:00.000Z",
  },
];

const sections = [
  ["objective", "Objective", "What question are you trying to answer?"],
  ["materials", "Materials", "Reagents, equipment, and samples used."],
  ["procedure", "Procedure", "Record the steps as you perform them."],
  ["results", "Results", "Observations, measurements, and data notes."],
  ["conclusion", "Conclusion", "Interpretation and next steps."],
];

function readWorkspace() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.notebooks?.length && Array.isArray(stored.entries)) return stored;
  } catch (error) {
    console.warn("Could not read the saved Fieldnote workspace; loading starter entries.", error);
  }
  return { notebooks: starterNotebooks, entries: starterEntries };
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    flask: <><path d="M9 3h6M10 3v6.2L4.9 18a2 2 0 0 0 1.7 3h10.8a2 2 0 0 0 1.7-3L14 9.2V3" /><path d="M7.5 15h9" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function initials(name) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function App() {
  const [workspace, setWorkspace] = useState(readWorkspace);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editorEntry, setEditorEntry] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const searchInput = useRef(null);
  const today = new Date();
  const longDate = today.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
  const dateWithYear = today.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.entries
      .filter((entry) => activeFilter === "all" || entry.status.toLowerCase().replace(" ", "-") === activeFilter)
      .filter((entry) => !activeNotebook || entry.notebookId === activeNotebook)
      .filter((entry) => {
        if (!query) return true;
        const notebookName = workspace.notebooks.find((notebook) => notebook.id === entry.notebookId)?.name || "";
        return [entry.title, entry.status, notebookName, ...entry.tags, ...sections.map(([key]) => entry[key])]
          .join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [activeFilter, activeNotebook, search, workspace]);

  const selectedEntry = workspace.entries.find((entry) => entry.id === selectedId) || filteredEntries[0] || null;
  const currentNotebook = activeNotebook
    ? workspace.notebooks.find((notebook) => notebook.id === activeNotebook)
    : null;
  const reviewedCount = workspace.entries.filter((entry) => entry.status === "Reviewed").length;
  const inProgressCount = workspace.entries.filter((entry) => entry.status === "In progress").length;

  function navigate(filter, notebookId = null) {
    setActiveFilter(filter);
    setActiveNotebook(notebookId);
    setSelectedId(null);
  }

  function saveEntry(values) {
    const now = new Date().toISOString();
    if (editorEntry?.id) {
      setWorkspace((previous) => ({
        ...previous,
        entries: previous.entries.map((entry) => entry.id === editorEntry.id
          ? { ...entry, ...values, updatedAt: now }
          : entry),
      }));
      setSelectedId(editorEntry.id);
    } else {
      const newEntry = {
        ...values,
        id: `exp-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: now,
        updatedAt: now,
      };
      setWorkspace((previous) => ({ ...previous, entries: [newEntry, ...previous.entries] }));
      setActiveFilter("all");
      setActiveNotebook(null);
      setSelectedId(newEntry.id);
    }
    setEditorEntry(null);
    setIsCreating(false);
  }

  function createNotebook() {
    const name = window.prompt("Name your notebook");
    if (!name?.trim()) return;
    const notebook = {
      id: `notebook-${Date.now()}`,
      name: name.trim(),
      color: ["mint", "lilac", "peach"][workspace.notebooks.length % 3],
      note: "A new space for your work",
    };
    setWorkspace((previous) => ({ ...previous, notebooks: [...previous.notebooks, notebook] }));
    navigate("all", notebook.id);
  }

  const heading = currentNotebook?.name || (
    activeFilter === "in-progress" ? "In progress" : activeFilter === "reviewed" ? "Reviewed entries" : "All experiments"
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate("all"); }}>
          <span className="brand-mark"><Icon name="flask" size={20} /></span>
          <span>fieldnote<span className="brand-period">.</span></span>
        </a>

        <button className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy"><strong>Northstar Lab</strong><small>Research workspace</small></span>
          <span className="switcher-dots"><Icon name="dots" size={17} /></span>
        </button>

        <div className="nav-section">
          <p className="nav-label">WORKSPACE</p>
          <button className={`nav-link ${activeFilter === "all" && !activeNotebook ? "active" : ""}`} onClick={() => navigate("all")}>
            <Icon name="grid" /><span>All experiments</span><span className="nav-count">{workspace.entries.length}</span>
          </button>
          <button className={`nav-link ${activeFilter === "in-progress" ? "active" : ""}`} onClick={() => navigate("in-progress")}>
            <Icon name="clock" /><span>In progress</span><span className="nav-count">{inProgressCount}</span>
          </button>
          <button className={`nav-link ${activeFilter === "reviewed" ? "active" : ""}`} onClick={() => navigate("reviewed")}>
            <Icon name="check" /><span>Reviewed</span><span className="nav-count">{reviewedCount}</span>
          </button>
        </div>

        <div className="nav-section notebook-section">
          <div className="nav-label-row"><p className="nav-label">NOTEBOOKS</p><button aria-label="Add notebook" className="icon-button tiny" onClick={createNotebook}><Icon name="plus" size={16} /></button></div>
          {workspace.notebooks.map((notebook) => (
            <button key={notebook.id} className={`notebook-link ${activeNotebook === notebook.id ? "active" : ""}`} onClick={() => navigate("all", notebook.id)}>
              <span className={`notebook-dot ${notebook.color}`} /><span>{notebook.name}</span>
            </button>
          ))}
          <button className="add-notebook" onClick={createNotebook}><Icon name="plus" size={15} /> Add notebook</button>
        </div>

        <div className="sidebar-bottom">
          <div className="storage-note"><span className="storage-icon"><Icon name="book" size={16} /></span><span><strong>Your lab is saved</strong><small>Saved on this device</small></span><span className="online-dot" /></div>
          <button className="profile-button"><span className="profile-avatar">MC</span><span><strong>Maya Chen</strong><small>Researcher</small></span><Icon name="dots" size={18} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Northstar Lab</span><Icon name="chevron" size={15} /><strong>{currentNotebook?.name || "Notebook"}</strong></div>
          <div className="topbar-right"><span className="today-label">{longDate}</span><span className="topbar-avatar">MC</span></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{dateWithYear.toUpperCase()} <span className="eyebrow-dot">·</span> NORTHSTAR LAB</p>
              <h1>Your lab, in focus<span className="title-dot">.</span></h1>
              <p className="welcome-subtitle">A little progress adds up. Pick up where you left off.</p>
            </div>
            <button className="primary-button" onClick={() => { setEditorEntry(null); setIsCreating(true); }}><Icon name="plus" size={18} /> New experiment</button>
          </section>

          <section className="stats-grid" aria-label="Notebook summary">
            <div className="stat-card stat-card-total"><div className="stat-top"><span className="stat-icon olive"><Icon name="book" size={17} /></span><span className="stat-caption">IN YOUR NOTEBOOK</span><span className="stat-spark">↗</span></div><strong>{workspace.entries.length.toString().padStart(2, "0")}</strong><span className="stat-description">total experiments</span></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon amber"><Icon name="clock" size={17} /></span><span className="stat-caption">ACTIVE WORK</span><span className="stat-trend">this week</span></div><strong>{inProgressCount.toString().padStart(2, "0")}</strong><span className="stat-description">in progress</span></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon green"><Icon name="check" size={17} /></span><span className="stat-caption">READY TO REFERENCE</span><span className="stat-trend">all time</span></div><strong>{reviewedCount.toString().padStart(2, "0")}</strong><span className="stat-description">reviewed entries</span></div>
          </section>

          <section className="work-area">
            <div className="entries-column">
              <div className="section-heading">
                <div><h2>{heading}</h2><p>{filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} <span className="subtle-separator">·</span> Recently updated</p></div>
                <div className="list-tools">
                  <label className="search-box"><Icon name="search" size={17} /><input ref={searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search entries..." aria-label="Search entries" /><kbd>⌘ K</kbd></label>
                  <button className="filter-button" onClick={() => navigate(activeFilter === "all" ? "in-progress" : "all")}>{activeFilter === "all" ? "Filter" : "Clear filter"}<span className="filter-lines">≡</span></button>
                </div>
              </div>
              <div className="entry-list">
                {filteredEntries.length ? filteredEntries.map((entry) => {
                  const notebook = workspace.notebooks.find((item) => item.id === entry.notebookId);
                  return (
                    <button key={entry.id} className={`entry-row ${selectedEntry?.id === entry.id ? "selected" : ""}`} onClick={() => setSelectedId(entry.id)}>
                      <span className={`entry-marker ${notebook?.color || "mint"}`}><Icon name="flask" size={17} /></span>
                      <span className="entry-main"><span className="entry-title">{entry.title}</span><span className="entry-meta">{notebook?.name || "Notebook"} <span>·</span> Updated {formatDate(entry.updatedAt)}</span><span className="tag-row">{entry.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</span></span>
                      <span className={`status-pill ${entry.status.toLowerCase().replace(" ", "-")}`}><span />{entry.status}</span>
                      <span className="row-chevron"><Icon name="chevron" size={16} /></span>
                    </button>
                  );
                }) : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={22} /></span><strong>No experiments found</strong><span>Try a different search or clear your filters.</span><button onClick={() => { setSearch(""); navigate("all"); }}>Clear search and filters</button></div>}
              </div>
              <div className="list-footer"><span>Showing {filteredEntries.length} of {workspace.entries.length} experiments</span><span>Saved locally <span className="sync-dot" /></span></div>
            </div>

            <aside className="detail-column">
              {selectedEntry ? (
                <article className="detail-card">
                  <div className="detail-card-top"><span className="detail-label">ENTRY PREVIEW</span><button className="icon-button" aria-label="Edit experiment" onClick={() => { setEditorEntry(selectedEntry); setIsCreating(true); }}><Icon name="edit" size={17} /></button></div>
                  <span className={`detail-icon ${workspace.notebooks.find((item) => item.id === selectedEntry.notebookId)?.color || "mint"}`}><Icon name="flask" size={21} /></span>
                  <h3>{selectedEntry.title}</h3>
                  <div className="detail-meta"><span className={`status-pill ${selectedEntry.status.toLowerCase().replace(" ", "-")}`}><span />{selectedEntry.status}</span><span>Updated {formatDate(selectedEntry.updatedAt)}</span></div>
                  <div className="detail-tags">{selectedEntry.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  <div className="detail-divider" />
                  {sections.map(([key, title]) => selectedEntry[key] ? <div className="preview-section" key={key}><h4>{title}</h4><p>{selectedEntry[key]}</p></div> : null)}
                  <button className="open-entry-button" onClick={() => { setEditorEntry(selectedEntry); setIsCreating(true); }}>Open full entry <Icon name="arrow" size={16} /></button>
                </article>
              ) : (
                <div className="detail-card detail-empty"><span className="empty-icon"><Icon name="flask" size={22} /></span><strong>Your next discovery starts here</strong><span>Create an experiment or choose one from the list to see its details.</span><button className="text-button" onClick={() => { setEditorEntry(null); setIsCreating(true); }}>Start an experiment <Icon name="arrow" size={15} /></button></div>
              )}
              <div className="tip-card"><span className="tip-star">✳</span><div><strong>A note from your lab</strong><p>Small details matter. Capture observations as they happen, and future-you will thank you.</p></div></div>
              <div className="privacy-note"><span className="privacy-lock">⌑</span><span>Your entries are saved locally in this browser.</span></div>
            </aside>
          </section>
          <footer className="page-footer"><span>Made for curious minds.</span><span>Fieldnote <span className="footer-dot">·</span> A personal lab notebook</span></footer>
        </div>
      </main>

      {isCreating && <EntryEditor
        entry={editorEntry}
        notebooks={workspace.notebooks}
        defaultNotebookId={activeNotebook || workspace.notebooks[0]?.id}
        onClose={() => { setIsCreating(false); setEditorEntry(null); }}
        onSave={saveEntry}
      />}
    </div>
  );
}

function EntryEditor({ entry, notebooks, defaultNotebookId, onClose, onSave }) {
  const [title, setTitle] = useState(entry?.title || "");
  const [notebookId, setNotebookId] = useState(entry?.notebookId || defaultNotebookId);
  const [status, setStatus] = useState(entry?.status || "Draft");
  const [tagsText, setTagsText] = useState(entry?.tags?.join(", ") || "");
  const [content, setContent] = useState(Object.fromEntries(sections.map(([key]) => [key, entry?.[key] || ""])));
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!title.trim()) { setError("Give your experiment a title to save it."); return; }
    onSave({
      title: title.trim(),
      notebookId: notebookId || notebooks[0]?.id,
      status,
      tags: [...new Set(tagsText.split(",").map((tag) => tag.trim()).filter(Boolean))],
      ...content,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="editor-modal" onSubmit={submit}>
        <div className="editor-header"><div><p className="eyebrow">{entry ? "EXPERIMENT ENTRY" : "NEW NOTEBOOK ENTRY"}</p><h2>{entry ? "Edit experiment" : "New experiment"}</h2></div><button type="button" className="icon-button close-button" aria-label="Close editor" onClick={onClose}><Icon name="close" /></button></div>
        <div className="editor-body">
          <label className="field-label">Experiment title<input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="Give this experiment a clear name" /></label>
          <div className="field-pair">
            <label className="field-label">Notebook<select value={notebookId || ""} onChange={(event) => setNotebookId(event.target.value)}>{notebooks.map((notebook) => <option value={notebook.id} key={notebook.id}>{notebook.name}</option>)}</select></label>
            <label className="field-label">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Draft</option><option>In progress</option><option>Reviewed</option></select></label>
          </div>
          <label className="field-label">Tags <span className="field-hint">Separate with commas</span><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="e.g. cell assay, pilot study" /></label>
          <div className="editor-divider" />
          {sections.map(([key, label, hint]) => (
            <label className="field-label section-field" key={key}>{label}<span className="field-hint">{hint}</span><textarea rows={key === "procedure" || key === "results" ? 3 : 2} value={content[key]} onChange={(event) => setContent((previous) => ({ ...previous, [key]: event.target.value }))} placeholder={`Add your ${label.toLowerCase()}...`} /></label>
          ))}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="editor-footer"><span className="editor-save-note">Your changes save to this device.</span><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{entry ? "Save changes" : "Create experiment"}</button></div>
      </form>
    </div>
  );
}

export default App;
