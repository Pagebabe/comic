import brief from '../data/shot009Brief.json';

const shotBrief = brief as {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  target_path: string;
  goal: string;
  camera: string;
  must_have: string[];
  must_not_have: string[];
  clean_prompt: string;
  negative_prompt: string;
  approval_checks: string[];
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function NextShotBrief() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Next Shot Brief</p>
          <h2>{shotBrief.tv_shot_id} · {shotBrief.title}</h2>
        </div>
        <button className="primary-button">Create Brief File</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Scene</p><strong>{shotBrief.scene_id}</strong><span>current blocker</span></div></div>
        <div className="stat-card"><div><p>Target</p><strong>v2</strong><span>{shotBrief.target_path}</span></div></div>
        <div className="stat-card"><div><p>Checks</p><strong>{shotBrief.approval_checks.length}</strong><span>approval rules</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Goal</p>
        <h2>{shotBrief.goal}</h2>
        <p className="body-copy">{shotBrief.camera}</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Must Have" items={shotBrief.must_have} />
        <ListBox title="Must Not Have" items={shotBrief.must_not_have} />
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Clean Prompt</p><h3>Use for next keyframe attempt</h3></div></div>
        <textarea readOnly value={shotBrief.clean_prompt} />
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Negative Prompt</p><h3>Hard blockers</h3></div></div>
        <textarea readOnly value={shotBrief.negative_prompt} />
      </article>

      <div className="grid two-col">
        <ListBox title="Approval Checks" items={shotBrief.approval_checks} />
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create next brief JSON</h3></div></div>
          <div className="prompt-box">npm run create:next-shot-brief</div>
          <p className="body-copy">Output: outputs/pilot/next/ep001_next_shot_brief.json</p>
        </article>
      </div>
    </section>
  );
}
