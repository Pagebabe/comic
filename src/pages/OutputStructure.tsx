import outputStructure from '../data/outputStructure.json';

type OutputFolder = {
  id: string;
  path: string;
  purpose: string;
  file_pattern: string;
  manifest: string;
};

const structure = outputStructure as {
  root: string;
  episode_id: string;
  rules: string[];
  folders: OutputFolder[];
  manifest_fields: string[];
};

export function OutputStructure() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Output Structure</p>
          <h2>Local production folders for the pilot episode</h2>
        </div>
        <button className="primary-button">Create Folders</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Root</p><strong>{structure.root}</strong><span>{structure.episode_id}</span></div></div>
        <div className="stat-card"><div><p>Folders</p><strong>{structure.folders.length}</strong><span>production stages</span></div></div>
        <div className="stat-card"><div><p>Manifest Fields</p><strong>{structure.manifest_fields.length}</strong><span>asset tracking</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Rule</p>
        <h2>Nothing becomes canon without review metadata.</h2>
        <p className="body-copy">Generated media stays local in outputs/. The repo stores structure, prompts and decisions, not heavy MP4s or raw generations.</p>
      </div>

      <div className="grid two-col">
        <div className="dialogue-box">
          <p className="eyebrow">Rules</p>
          {structure.rules.map((rule) => <p key={rule}>• {rule}</p>)}
        </div>
        <div className="dialogue-box">
          <p className="eyebrow">Manifest Fields</p>
          {structure.manifest_fields.map((field) => <p key={field}>• {field}</p>)}
        </div>
      </div>

      <div className="page-stack">
        {structure.folders.map((folder) => (
          <article className="card" key={folder.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{folder.id}</p>
                <h3>{folder.path}</h3>
              </div>
              <span className="status-badge">{folder.manifest}</span>
            </div>
            <p className="body-copy">{folder.purpose}</p>
            <label>File Pattern</label>
            <textarea readOnly value={folder.file_pattern} />
          </article>
        ))}
      </div>
    </section>
  );
}
