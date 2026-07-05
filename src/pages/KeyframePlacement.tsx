import template from '../data/manualKeyframeTemplate.json';
import shotBriefs from '../data/pilotShotBriefs.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type Brief = {
  tv_shot_id: string;
  title: string;
  priority: number;
  target_path: string;
};

type ReviewItem = {
  tv_shot_id: string;
  title: string;
  status: string;
  asset_target: string;
};

const briefs = (shotBriefs as Brief[]).slice().sort((a, b) => a.priority - b.priority);
const reviews = tvReviewQueue as ReviewItem[];
const config = template as { name: string; purpose: string; receipt_output: string; rules: string[] };

export function KeyframePlacement() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Manual Keyframe Placement</p>
          <h2>{config.name}</h2>
        </div>
        <button className="primary-button">Register Keyframe</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{config.purpose}</h2>
        <p className="body-copy">Use this after an external image render. The script copies the finished image into the expected pilot keyframe target.</p>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Brief Targets</p><strong>{briefs.length}</strong><span>remaining shots</span></div></div>
        <div className="stat-card"><div><p>Review Targets</p><strong>{reviews.length}</strong><span>all TV shots</span></div></div>
        <div className="stat-card"><div><p>Receipt</p><strong>JSON</strong><span>{config.receipt_output}</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Command Pattern</p><h3>Use a shot ID and an image file</h3></div></div>
        <div className="prompt-box">npm run place:keyframe -- ep001_tv_009 IMAGE_FILE</div>
        <div className="prompt-box">npm run place:keyframe -- ep001_tv_009 IMAGE_FILE --replace</div>
      </article>

      <div className="grid two-col">
        <div className="dialogue-box">
          <p className="eyebrow">Rules</p>
          {config.rules.map((rule) => <p key={rule}>• {rule}</p>)}
        </div>
        <div className="dialogue-box">
          <p className="eyebrow">After Placement</p>
          <p>• npm run create:asset-intake</p>
          <p>• npm run sync:asset-previews</p>
          <p>• npm run create:review-summary</p>
          <p>• npm run create:pipeline-overview</p>
        </div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Remaining Brief Targets</p><h3>Use these first</h3></div></div>
        <div className="page-stack">
          {briefs.map((brief) => (
            <div className="dialogue-box" key={brief.tv_shot_id}>
              <p className="eyebrow">P{brief.priority} · {brief.tv_shot_id}</p>
              <p>{brief.title}</p>
              <p>{brief.target_path}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
