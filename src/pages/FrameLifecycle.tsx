import pilotShotBriefs from '../data/pilotShotBriefs.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type ShotBrief = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
};

type ReviewItem = {
  tv_shot_id: string;
  status: string;
};

const briefs = (pilotShotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const ready = briefs.filter((brief) => reviewByShot.get(brief.tv_shot_id)?.status === 'approved');
const open = briefs.filter((brief) => reviewByShot.get(brief.tv_shot_id)?.status !== 'approved');

export function FrameLifecycle() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Frame Lifecycle</p>
          <h2>Per-Shot Keyframe State Machine</h2>
        </div>
        <button className="primary-button">Create Lifecycle</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Track every shot from brief to approved official frame.</h2>
        <p className="body-copy">The local report checks candidates, QA decisions, promotions, official files and review approval in one place.</p>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total</p><strong>{briefs.length}</strong><span>tracked frames</span></div></div>
        <div className="stat-card"><div><p>Review Approved</p><strong>{ready.length}</strong><span>review queue</span></div></div>
        <div className="stat-card"><div><p>Open</p><strong>{open.length}</strong><span>needs production work</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create lifecycle report</h3></div></div>
        <div className="prompt-box">npm run create:frame-lifecycle</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_frame_lifecycle.json</p>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Lifecycle Order</p><h3>Frame state machine</h3></div></div>
        <div className="page-stack">
          {['brief_only', 'candidate_registered', 'qa_prepared', 'qa_approved_candidate', 'promoted_to_keyframe', 'official_file_exists', 'review_approved_ready'].map((state) => (
            <div className="dialogue-box" key={state}>{state}</div>
          ))}
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Tracked Shots</p><h3>Current static review view</h3></div></div>
        <div className="page-stack">
          {briefs.map((brief) => (
            <div className="dialogue-box" key={brief.tv_shot_id}>
              <p className="eyebrow">P{brief.priority} · {brief.scene_id} · {reviewByShot.get(brief.tv_shot_id)?.status ?? 'missing_review'}</p>
              <p>{brief.tv_shot_id} · {brief.title}</p>
              <p>{brief.target_path}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
