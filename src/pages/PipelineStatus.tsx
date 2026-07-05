import template from '../data/pipelineStatusTemplate.json';

const statusTemplate = template as {
  name: string;
  purpose: string;
  status_output: string;
  tracked_files: string[];
  status_levels: string[];
  rules: string[];
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function PipelineStatus() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pipeline Status</p>
          <h2>{statusTemplate.name}</h2>
        </div>
        <button className="primary-button">Create Overview</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Tracked</p><strong>{statusTemplate.tracked_files.length}</strong><span>local artifacts</span></div></div>
        <div className="stat-card"><div><p>Status Levels</p><strong>{statusTemplate.status_levels.length}</strong><span>pipeline states</span></div></div>
        <div className="stat-card"><div><p>Output</p><strong>JSON</strong><span>{statusTemplate.status_output}</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{statusTemplate.purpose}</h2>
        <p className="body-copy">Run the command after prepare, dry-run, preview check and asset intake to see where the pilot currently stands.</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Tracked Files" items={statusTemplate.tracked_files} />
        <ListBox title="Status Levels" items={statusTemplate.status_levels} />
        <ListBox title="Rules" items={statusTemplate.rules} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Local Command</p>
            <h3>Create Pipeline Overview</h3>
          </div>
        </div>
        <div className="prompt-box">npm run create:pipeline-overview</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_pipeline_overview.json</p>
      </div>
    </section>
  );
}
