import tvShots from '../data/tvShots.json';
import tvReviewQueue from '../data/tvReviewQueue.json';
import template from '../data/motionJobTemplate.json';

type TvShot = {
  id: string;
  episode_id: string;
  scene_id: string;
  title: string;
  duration_seconds: number;
  action?: string;
};

type ReviewItem = {
  tv_shot_id: string;
  status: string;
  current_version: string;
  asset_target: string;
};

const shots = tvShots as unknown as TvShot[];
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const motionTemplate = template as { output: string; defaults: { fps: number; motion_strength: string } };

const jobs = shots.map((shot) => {
  const review = reviewByShot.get(shot.id);
  const status = review?.status === 'approved' ? 'queued_for_motion' : `blocked_${review?.status ?? 'missing_review'}`;
  return { shot, review, status };
});

const queued = jobs.filter((job) => job.status === 'queued_for_motion');
const blocked = jobs.filter((job) => job.status !== 'queued_for_motion');

export function MotionJobs() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Motion Jobs</p>
          <h2>Pilot Image-to-Video Planning</h2>
        </div>
        <button className="primary-button">Create Motion Jobs</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total</p><strong>{jobs.length}</strong><span>TV shots</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{queued.length}</strong><span>motion-ready by review state</span></div></div>
        <div className="stat-card"><div><p>Blocked</p><strong>{blocked.length}</strong><span>needs keyframe work</span></div></div>
        <div className="stat-card"><div><p>FPS</p><strong>{motionTemplate.defaults.fps}</strong><span>{motionTemplate.defaults.motion_strength} motion</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Important</p>
        <h2>Motion starts only after clean approved keyframes.</h2>
        <p className="body-copy">The script creates jobs for all shots, but only approved shots are queued. Others stay blocked until the keyframe review is resolved.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create motion job package</h3></div></div>
        <div className="prompt-box">npm run create:motion-jobs</div>
        <p className="body-copy">Output: {motionTemplate.output}</p>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Queued</p><h3>Approved shots</h3></div></div>
          <div className="page-stack">
            {queued.map(({ shot, review }) => (
              <div className="dialogue-box" key={shot.id}>
                <p className="eyebrow">{shot.scene_id} · {review?.current_version}</p>
                <p>{shot.id} · {shot.title}</p>
                <p>{review?.asset_target}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Blocked</p><h3>Not ready for motion</h3></div></div>
          <div className="page-stack">
            {blocked.map(({ shot, review, status }) => (
              <div className="dialogue-box" key={shot.id}>
                <p className="eyebrow">{shot.scene_id} · {status}</p>
                <p>{shot.id} · {shot.title}</p>
                <p>{review?.asset_target ?? 'missing review target'}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
