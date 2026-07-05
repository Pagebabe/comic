import fixQueue from '../data/nextFixQueue.json';

type FixItem = {
  id: string;
  priority: number;
  type: string;
  scene_id: string;
  tv_shot_id: string;
  title: string;
  reason: string;
  instruction: string;
  must_have: string[];
  must_not_have: string[];
  output_target: string;
};

const fixes = (fixQueue as FixItem[]).sort((a, b) => a.priority - b.priority);

export function FixQueue() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Next Fix Queue</p>
          <h2>Do these in order to unlock assembly</h2>
        </div>
        <button className="primary-button">Start Priority 1</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total Fixes</p><strong>{fixes.length}</strong><span>next work items</span></div></div>
        <div className="stat-card"><div><p>Rebuilds</p><strong>{fixes.filter((item) => item.type === 'rebuild_keyframe').length}</strong><span>bad keyframes</span></div></div>
        <div className="stat-card"><div><p>Creates</p><strong>{fixes.filter((item) => item.type === 'create_keyframe').length}</strong><span>queued shots</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Priority Rule</p>
        <h2>Fix Shot 006 first.</h2>
        <p className="body-copy">The core fee gag is the most important blocker. If Shot 006 still has paper text, icons or infographics, the episode cannot feel clean or professional.</p>
      </div>

      <div className="page-stack">
        {fixes.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Priority {item.priority} · {item.type} · {item.scene_id}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="status-badge">{item.tv_shot_id}</span>
            </div>

            <div className="spec-grid">
              <div><span>Reason</span><p>{item.reason}</p></div>
              <div><span>Instruction</span><p>{item.instruction}</p></div>
            </div>

            <div className="grid two-col">
              <div className="dialogue-box">
                <p className="eyebrow">Must Have</p>
                {item.must_have.map((rule) => <p key={rule}>• {rule}</p>)}
              </div>
              <div className="dialogue-box">
                <p className="eyebrow">Must Not Have</p>
                {item.must_not_have.map((rule) => <p key={rule}>• {rule}</p>)}
              </div>
            </div>

            <label>Output Target</label>
            <textarea readOnly value={item.output_target} />
          </article>
        ))}
      </div>
    </section>
  );
}
