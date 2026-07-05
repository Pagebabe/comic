import tvReviewQueue from '../data/tvReviewQueue.json';
import nextFixQueue from '../data/nextFixQueue.json';

type ReviewItem = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  status: string;
  current_version: string;
  asset_target: string;
};

type FixItem = {
  tv_shot_id: string;
  title: string;
  priority: number;
  output_target: string;
};

const reviewItems = tvReviewQueue as ReviewItem[];
const fixes = (nextFixQueue as FixItem[]).slice().sort((a, b) => a.priority - b.priority);
const approved = reviewItems.filter((item) => item.status === 'approved');
const needsFix = reviewItems.filter((item) => item.status === 'needs_fix');
const queued = reviewItems.filter((item) => item.status === 'queued');
const firstFix = fixes[0];

const suggestedStep = firstFix
  ? {
      label: 'Fix Queue',
      title: firstFix.title,
      shot: firstFix.tv_shot_id,
      target: firstFix.output_target,
      command: `npm run place:keyframe -- ${firstFix.tv_shot_id} IMAGE_FILE`
    }
  : queued[0]
    ? {
        label: 'Queued Keyframe',
        title: queued[0].title,
        shot: queued[0].tv_shot_id,
        target: queued[0].asset_target,
        command: `npm run place:keyframe -- ${queued[0].tv_shot_id} IMAGE_FILE`
      }
    : {
        label: 'Ready Check',
        title: 'Run pilot readiness check',
        shot: 'ep001',
        target: 'outputs/pilot/status/ep001_assembly_gate.json',
        command: 'npm run check:pilot-ready'
      };

export function PilotStep() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pilot Step</p>
          <h2>Next Useful Production Step</h2>
        </div>
        <button className="primary-button">Create Step Report</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Approved</p><strong>{approved.length}</strong><span>review state</span></div></div>
        <div className="stat-card"><div><p>Needs Fix</p><strong>{needsFix.length}</strong><span>repair queue</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{queued.length}</strong><span>missing frames</span></div></div>
        <div className="stat-card"><div><p>Fix Items</p><strong>{fixes.length}</strong><span>next queue</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">{suggestedStep.label}</p>
        <h2>{suggestedStep.shot} · {suggestedStep.title}</h2>
        <p className="body-copy">Target: {suggestedStep.target}</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Generate exact local report</h3></div></div>
        <div className="prompt-box">npm run create:pilot-step</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_pilot_step.json</p>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Suggested Work Command</p><h3>Current visible next step</h3></div></div>
        <div className="prompt-box">{suggestedStep.command}</div>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Fix Queue</p><h3>Priority order</h3></div></div>
          <div className="page-stack">
            {fixes.map((item) => (
              <div className="dialogue-box" key={`${item.priority}-${item.tv_shot_id}`}>
                <p className="eyebrow">P{item.priority} · {item.tv_shot_id}</p>
                <p>{item.title}</p>
                <p>{item.output_target}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Open Review Items</p><h3>Not approved yet</h3></div></div>
          <div className="page-stack">
            {[...needsFix, ...queued].map((item) => (
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
