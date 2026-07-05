import tvShots from '../data/tvShots.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type TvShot = {
  id: string;
  scene_id: string;
  title: string;
  order: number;
  duration_seconds: number;
};

type ReviewItem = {
  tv_shot_id: string;
  status: string;
  asset_target: string;
};

const shots = (tvShots as unknown as TvShot[]).slice().sort((a, b) => a.order - b.order);
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const approved = shots.filter((shot) => reviewByShot.get(shot.id)?.status === 'approved');
const blocked = shots.filter((shot) => reviewByShot.get(shot.id)?.status !== 'approved');
const totalSeconds = shots.reduce((sum, shot) => sum + shot.duration_seconds, 0);

export function EpisodeState() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Episode State</p>
          <h2>Central Production Truth</h2>
        </div>
        <button className="primary-button">Create State</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>One JSON to unify review, frames, QA, promotion, motion and blockers.</h2>
        <p className="body-copy">This prevents the factory from having multiple conflicting sources of truth across separate reports.</p>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Shots</p><strong>{shots.length}</strong><span>TV timeline</span></div></div>
        <div className="stat-card"><div><p>Approved</p><strong>{approved.length}</strong><span>review queue</span></div></div>
        <div className="stat-card"><div><p>Blocked</p><strong>{blocked.length}</strong><span>needs work</span></div></div>
        <div className="stat-card"><div><p>Runtime</p><strong>{totalSeconds}s</strong><span>planned pilot</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create central episode state</h3></div></div>
        <div className="prompt-box">npm run create:frame-lifecycle</div>
        <div className="prompt-box">npm run create:episode-state</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_episode_state.json</p>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Shot State Preview</p><h3>Static source status</h3></div></div>
        <div className="page-stack">
          {shots.map((shot) => {
            const review = reviewByShot.get(shot.id);
            return (
              <div className="dialogue-box" key={shot.id}>
                <p className="eyebrow">#{shot.order} · {shot.scene_id} · {review?.status ?? 'missing_review'} · {shot.duration_seconds}s</p>
                <p>{shot.id} · {shot.title}</p>
                <p>{review?.asset_target ?? 'no target'}</p>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
