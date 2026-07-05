import pilotShotBriefs from '../data/pilotShotBriefs.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type ShotBrief = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
  clean_prompt: string;
  negative_prompt: string;
};

type ReviewItem = {
  tv_shot_id: string;
  status: string;
  asset_target: string;
};

const briefs = (pilotShotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const openBriefs = briefs.filter((brief) => reviewByShot.get(brief.tv_shot_id)?.status !== 'approved');

function hardRules(shotId: string) {
  const base = [
    'absolutely no readable text anywhere',
    'no logos, no posters, no labels, no subtitles, no speech bubbles',
    'keep character identities locked to the series bible',
    'simple clean cartoon composition, not photorealistic'
  ];
  if (shotId === 'ep001_tv_009') {
    return [...base, 'Sami is tired and calm, not threatening', 'blank coffee cup with no logo', 'plain hoodie with no text'];
  }
  if (shotId === 'ep001_tv_007') {
    return [...base, 'Kralle is a real cat, not humanoid', 'Rico counts coins quietly', 'no readable money details'];
  }
  return base;
}

export function FramePlan() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Frame Plan</p>
          <h2>Stronger Next Frame Instructions</h2>
        </div>
        <button className="primary-button">Create Plan</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Turn QA or open review state into stronger next-frame prompts.</h2>
        <p className="body-copy">This helps prevent repeated failures like readable text, character drift, logo artifacts or wrong Sami/Kralle styling.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create next frame plan</h3></div></div>
        <div className="prompt-box">npm run create:frame-plan</div>
        <p className="body-copy">Output: outputs/pilot/attempts/ep001_next_frame_attempts.json</p>
      </article>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Open</p><strong>{openBriefs.length}</strong><span>not approved</span></div></div>
        <div className="stat-card"><div><p>Briefs</p><strong>{briefs.length}</strong><span>remaining prompt sources</span></div></div>
        <div className="stat-card"><div><p>Next</p><strong>{openBriefs[0]?.tv_shot_id ?? 'none'}</strong><span>{openBriefs[0]?.title ?? 'all done'}</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Open Frame Plans</p><h3>Use priority order</h3></div></div>
        <div className="page-stack">
          {openBriefs.map((brief) => (
            <div className="dialogue-box" key={brief.tv_shot_id}>
              <p className="eyebrow">P{brief.priority} · {reviewByShot.get(brief.tv_shot_id)?.status ?? 'missing_review'}</p>
              <p>{brief.tv_shot_id} · {brief.title}</p>
              <p>{brief.target_path}</p>
              <p>Hard rules: {hardRules(brief.tv_shot_id).join(' · ')}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
