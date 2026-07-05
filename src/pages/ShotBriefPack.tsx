import shotBriefs from '../data/pilotShotBriefs.json';

type ShotBrief = {
  id: string;
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
  goal: string;
  clean_prompt: string;
  negative_prompt: string;
};

const briefs = (shotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);

export function ShotBriefPack() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Shot Brief Pack</p>
          <h2>Remaining Pilot Keyframe Briefs</h2>
        </div>
        <button className="primary-button">Export Brief Pack</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Briefs</p><strong>{briefs.length}</strong><span>remaining shot plans</span></div></div>
        <div className="stat-card"><div><p>Next</p><strong>{briefs[0]?.tv_shot_id}</strong><span>{briefs[0]?.title}</span></div></div>
        <div className="stat-card"><div><p>Output</p><strong>JSON</strong><span>outputs/pilot/next</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Finish the pilot without drifting.</h2>
        <p className="body-copy">Each remaining shot now has a target path, clean prompt and hard negative prompt. Generate in priority order, then push through Asset Intake, Gallery and Review.</p>
      </div>

      <div className="page-stack">
        {briefs.map((brief) => (
          <article className="card" key={brief.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">P{brief.priority} · {brief.scene_id}</p>
                <h3>{brief.tv_shot_id} · {brief.title}</h3>
              </div>
              <span className="status-badge">brief</span>
            </div>

            <div className="spec-grid">
              <div><span>Goal</span><p>{brief.goal}</p></div>
              <div><span>Target Path</span><p>{brief.target_path}</p></div>
            </div>

            <div className="grid two-col">
              <div>
                <label>Clean Prompt</label>
                <textarea readOnly value={brief.clean_prompt} />
              </div>
              <div>
                <label>Negative Prompt</label>
                <textarea readOnly value={brief.negative_prompt} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Export all remaining briefs</h3></div></div>
        <div className="prompt-box">npm run create:shot-brief-pack</div>
        <p className="body-copy">Output: outputs/pilot/next/ep001_remaining_shot_briefs.json</p>
      </article>
    </section>
  );
}
