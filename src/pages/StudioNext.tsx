import nextFixQueue from '../data/nextFixQueue.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type FixItem = {
  tv_shot_id: string;
  title: string;
  priority: number;
  output_target: string;
};

type ReviewItem = {
  tv_shot_id: string;
  title: string;
  status: string;
  asset_target: string;
};

const fixes = (nextFixQueue as FixItem[]).slice().sort((a, b) => a.priority - b.priority);
const reviews = tvReviewQueue as ReviewItem[];
const openReviews = reviews.filter((item) => item.status !== 'approved');
const nextFix = fixes[0];
const nextReview = openReviews[0];
const suggested = nextFix
  ? {
      type: 'fix_queue',
      title: nextFix.title,
      shot: nextFix.tv_shot_id,
      target: nextFix.output_target,
      command: `npm run create:frame-plan`
    }
  : nextReview
    ? {
        type: 'open_review',
        title: nextReview.title,
        shot: nextReview.tv_shot_id,
        target: nextReview.asset_target,
        command: `npm run register:candidate -- ${nextReview.tv_shot_id} IMAGE_FILE --tool manual`
      }
    : {
        type: 'ready_check',
        title: 'Run pilot readiness and motion planning',
        shot: 'ep001',
        target: 'outputs/pilot/status/ep001_studio_next.json',
        command: 'npm run studio:next'
      };

export function StudioNext() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Studio Next</p>
          <h2>One Command Production Steering</h2>
        </div>
        <button className="primary-button">Run Next</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">{suggested.type}</p>
        <h2>{suggested.shot} · {suggested.title}</h2>
        <p className="body-copy">Target: {suggested.target}</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Main Command</p><h3>Run the studio next step report</h3></div></div>
        <div className="prompt-box">npm run studio:next</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_studio_next.json</p>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Suggested Work</p><h3>Current visible command</h3></div></div>
          <div className="prompt-box">{suggested.command}</div>
          <p className="body-copy">The local JSON report may give a more exact command after checking files on disk.</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Open Routes</p><h3>Use after running</h3></div></div>
          <div className="page-stack">
            {['#/studio-status', '#/pilot-step', '#/frame-plan', '#/frame-registry', '#/asset-gallery'].map((route) => (
              <div className="dialogue-box" key={route}>{route}</div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
