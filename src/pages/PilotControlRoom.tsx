import tvReviewQueue from '../data/tvReviewQueue.json';
import nextFixQueue from '../data/nextFixQueue.json';

type ReviewItem = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  status: string;
  current_version: string;
  asset_target: string;
  known_issue: string;
};

type FixItem = {
  id: string;
  priority: number;
  tv_shot_id: string;
  title: string;
  type: string;
  output_target: string;
};

const reviewItems = tvReviewQueue as ReviewItem[];
const fixItems = nextFixQueue as FixItem[];

const counts = reviewItems.reduce<Record<string, number>>((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const approved = counts.approved ?? 0;
const needsFix = counts.needs_fix ?? 0;
const queued = counts.queued ?? 0;
const progress = Math.round((approved / reviewItems.length) * 100);
const nextFix = [...fixItems].sort((a, b) => a.priority - b.priority)[0];

const productionCommands = [
  'npm run prepare:pilot',
  'npm run comfy:dry-run',
  'npm run comfy:check-preview',
  'npm run create:asset-intake',
  'npm run sync:asset-previews',
  'npm run create:review-summary',
  'npm run create:pipeline-overview',
  'npm run build'
];

export function PilotControlRoom() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pilot Control Room</p>
          <h2>Episode 001 · Rico gegen Berlin · Die Entkommerzialisierungsgebühr</h2>
        </div>
        <button className="primary-button">Open Asset Gallery</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Progress</p><strong>{progress}%</strong><span>{approved}/{reviewItems.length} approved</span></div></div>
        <div className="stat-card"><div><p>Approved</p><strong>{approved}</strong><span>ready shots</span></div></div>
        <div className="stat-card"><div><p>Needs Fix</p><strong>{needsFix}</strong><span>repair blockers</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{queued}</strong><span>missing shots</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Current Focus</p>
        <h2>{nextFix ? `${nextFix.tv_shot_id} · ${nextFix.title}` : 'All fix items cleared'}</h2>
        <p className="body-copy">Shot 006 is now approved as v4 candidate. The next production bottleneck is the first remaining item in the fix queue.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Review State</p><h3>Shot Board</h3></div></div>
          <div className="page-stack">
            {reviewItems.map((item) => (
              <div className="prompt-box" key={item.tv_shot_id}>
                {item.tv_shot_id} · {item.status} · {item.current_version} · {item.title}
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Next Fix Queue</p><h3>Remaining Work</h3></div></div>
          <div className="page-stack">
            {fixItems.map((item) => (
              <div className="dialogue-box" key={item.id}>
                <p className="eyebrow">P{item.priority} · {item.type}</p>
                <p>{item.tv_shot_id} · {item.title}</p>
                <p>{item.output_target}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Production Run</p><h3>Commands After Saving New Images</h3></div></div>
        <div className="grid two-col">
          {productionCommands.map((command) => <div className="prompt-box" key={command}>{command}</div>)}
        </div>
      </article>
    </section>
  );
}
