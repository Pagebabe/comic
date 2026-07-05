import tvReviewQueue from '../data/tvReviewQueue.json';

type ReviewItem = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  status: string;
  current_version: string;
  asset_target: string;
};

const items = tvReviewQueue as ReviewItem[];
const approved = items.filter((item) => item.status === 'approved');
const blocked = items.filter((item) => item.status !== 'approved');
const progress = Math.round((approved.length / items.length) * 100);

export function PilotReady() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pilot Ready Check</p>
          <h2>Keyframes before Assembly</h2>
        </div>
        <button className="primary-button">Run Local Check</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Review Progress</p><strong>{progress}%</strong><span>{approved.length}/{items.length} approved</span></div></div>
        <div className="stat-card"><div><p>Approved</p><strong>{approved.length}</strong><span>review-ready shots</span></div></div>
        <div className="stat-card"><div><p>Blocked</p><strong>{blocked.length}</strong><span>not ready yet</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Local File Check</p>
        <h2>Use the terminal check before assembly.</h2>
        <p className="body-copy">The dashboard can show review state. The local command also checks if the actual image files exist on disk.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Command</p><h3>Check pilot readiness</h3></div></div>
        <div className="prompt-box">npm run check:pilot-ready</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_assembly_gate.json</p>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Approved</p><h3>Can proceed if file exists</h3></div></div>
          <div className="page-stack">
            {approved.map((item) => (
              <div className="dialogue-box" key={item.tv_shot_id}>
                <p className="eyebrow">{item.scene_id} · {item.current_version}</p>
                <p>{item.tv_shot_id} · {item.title}</p>
                <p>{item.asset_target}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Blocked</p><h3>Must be resolved first</h3></div></div>
          <div className="page-stack">
            {blocked.map((item) => (
              <div className="dialogue-box" key={item.tv_shot_id}>
                <p className="eyebrow">{item.scene_id} · {item.status}</p>
                <p>{item.tv_shot_id} · {item.title}</p>
                <p>{item.asset_target}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
