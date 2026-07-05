import tvReviewQueue from '../data/tvReviewQueue.json';
import nextFixQueue from '../data/nextFixQueue.json';

type ReviewItem = {
  tv_shot_id: string;
  status: string;
};

type FixItem = {
  tv_shot_id: string;
  title: string;
  priority: number;
};

const reviewItems = tvReviewQueue as ReviewItem[];
const fixes = (nextFixQueue as FixItem[]).slice().sort((a, b) => a.priority - b.priority);
const approved = reviewItems.filter((item) => item.status === 'approved').length;
const needsFix = reviewItems.filter((item) => item.status === 'needs_fix').length;
const queued = reviewItems.filter((item) => item.status === 'queued').length;
const nextFix = fixes[0];

const routes = ['#/pilot-step', '#/pilot-control', '#/asset-gallery', '#/pipeline-status', '#/motion-jobs'];
const commands = [
  'npm run create:studio-status',
  'npm run create:pilot-step',
  'npm run check:pilot-ready',
  'npm run create:motion-jobs',
  'npm run create:camera-notes'
];

export function StudioStatus() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Studio Status</p>
          <h2>One Run Pilot Overview</h2>
        </div>
        <button className="primary-button">Run Status</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Approved</p><strong>{approved}</strong><span>review queue</span></div></div>
        <div className="stat-card"><div><p>Needs Fix</p><strong>{needsFix}</strong><span>repair work</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{queued}</strong><span>not created yet</span></div></div>
        <div className="stat-card"><div><p>Fix Queue</p><strong>{fixes.length}</strong><span>priority items</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Current Creative Bottleneck</p>
        <h2>{nextFix ? `${nextFix.tv_shot_id} · ${nextFix.title}` : 'No fix queue items'}</h2>
        <p className="body-copy">The studio status command refreshes all key local status reports and writes one combined JSON overview.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Commands</p><h3>Local run set</h3></div></div>
          <div className="page-stack">
            {commands.map((command) => <div className="prompt-box" key={command}>{command}</div>)}
          </div>
          <p className="body-copy">Main output: outputs/pilot/status/ep001_studio_status.json</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Open After Run</p><h3>Most useful pages</h3></div></div>
          <div className="page-stack">
            {routes.map((route) => <div className="dialogue-box" key={route}>{route}</div>)}
          </div>
        </article>
      </div>
    </section>
  );
}
