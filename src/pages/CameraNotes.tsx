import tvShots from '../data/tvShots.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type TvShot = {
  id: string;
  scene_id: string;
  title: string;
  duration_seconds: number;
};

type ReviewItem = {
  tv_shot_id: string;
  status: string;
  asset_target: string;
};

const shots = tvShots as TvShot[];
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));

const rows = shots.map((shot, index) => {
  const review = reviewByShot.get(shot.id);
  return {
    priority: index + 1,
    shot,
    review,
    ready: review?.status === 'approved'
  };
});

export function CameraNotes() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Camera Notes</p>
          <h2>Motion Text Files</h2>
        </div>
        <button className="primary-button">Create Notes</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Export motion planning text per TV shot.</h2>
        <p className="body-copy">Run motion jobs first, then export readable camera notes for each shot. These files are planning support and do not approve any output.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Commands</p><h3>Create notes after motion jobs</h3></div></div>
        <div className="prompt-box">npm run create:motion-jobs</div>
        <div className="prompt-box">npm run create:camera-notes</div>
        <p className="body-copy">Output root: outputs/pilot/motion-text</p>
      </article>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total</p><strong>{rows.length}</strong><span>shots</span></div></div>
        <div className="stat-card"><div><p>Ready</p><strong>{rows.filter((row) => row.ready).length}</strong><span>approved keyframes</span></div></div>
        <div className="stat-card"><div><p>Blocked</p><strong>{rows.filter((row) => !row.ready).length}</strong><span>needs keyframe work</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Files</p><h3>Expected note files</h3></div></div>
        <div className="page-stack">
          {rows.map((row) => (
            <div className="dialogue-box" key={row.shot.id}>
              <p className="eyebrow">{String(row.priority).padStart(2, '0')} · {row.review?.status ?? 'missing_review'}</p>
              <p>{row.shot.id} · {row.shot.title}</p>
              <p>outputs/pilot/motion-text/{String(row.priority).padStart(2, '0')}_{row.shot.id}.txt</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
