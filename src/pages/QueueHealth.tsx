import nextFixQueue from '../data/nextFixQueue.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type FixItem = {
  id: string;
  priority: number;
  tv_shot_id: string;
  title: string;
  type: string;
  output_target: string;
};

type ReviewItem = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  status: string;
  asset_target: string;
};

const fixes = nextFixQueue as FixItem[];
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const queueByShot = new Map(fixes.map((item) => [item.tv_shot_id, item]));

const queueRows = fixes
  .map((item) => {
    const review = reviewByShot.get(item.tv_shot_id);
    return {
      item,
      review,
      stale: review?.status === 'approved',
      missingReview: !review
    };
  })
  .sort((a, b) => a.item.priority - b.item.priority);

const missingRows = reviews.filter((item) => item.status !== 'approved' && !queueByShot.has(item.tv_shot_id));
const staleRows = queueRows.filter((row) => row.stale || row.missingReview);
const healthyRows = queueRows.filter((row) => !row.stale && !row.missingReview);

export function QueueHealth() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Queue Health</p>
          <h2>Fix Queue vs Review Queue</h2>
        </div>
        <button className="primary-button">Check Queue</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Queue Items</p><strong>{queueRows.length}</strong><span>tracked fixes</span></div></div>
        <div className="stat-card"><div><p>Healthy</p><strong>{healthyRows.length}</strong><span>still valid</span></div></div>
        <div className="stat-card"><div><p>Stale</p><strong>{staleRows.length}</strong><span>approved or missing review</span></div></div>
        <div className="stat-card"><div><p>Missing</p><strong>{missingRows.length}</strong><span>open review without queue</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Rule</p>
        <h2>Queue health is a report, not an auto-edit.</h2>
        <p className="body-copy">Use this to catch stale queue items after shots get approved. The source queue stays untouched until you intentionally update it.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create queue health report</h3></div></div>
        <div className="prompt-box">npm run check:queue-health</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_queue_health.json</p>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Stale / Problem Items</p><h3>Needs manual cleanup</h3></div></div>
          <div className="page-stack">
            {staleRows.length === 0 ? <div className="dialogue-box">No stale queue items.</div> : staleRows.map(({ item, review }) => (
              <div className="dialogue-box" key={item.id}>
                <p className="eyebrow">P{item.priority} · {item.tv_shot_id}</p>
                <p>{item.title}</p>
                <p>review: {review?.status ?? 'missing_review'}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Missing Queue Items</p><h3>Open review state without queue</h3></div></div>
          <div className="page-stack">
            {missingRows.length === 0 ? <div className="dialogue-box">No missing queue entries.</div> : missingRows.map((item) => (
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
