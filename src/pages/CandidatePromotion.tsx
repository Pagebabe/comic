import pilotShotBriefs from '../data/pilotShotBriefs.json';

type ShotBrief = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
};

const briefs = (pilotShotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);

export function CandidatePromotion() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Candidate Promotion</p>
          <h2>Turn a checked candidate into the official keyframe</h2>
        </div>
        <button className="primary-button">Promote Candidate</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Promotion is the bridge from candidate registry to official keyframe target.</h2>
        <p className="body-copy">Use this only after checking the candidate visually. Promotion copies the latest candidate for a shot into the official target path and writes a receipt.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">By Shot ID</p><h3>Promote newest candidate for a shot</h3></div></div>
          <div className="prompt-box">npm run promote:candidate -- ep001_tv_009</div>
          <div className="prompt-box">npm run promote:candidate -- ep001_tv_009 --note approved-clean-sami</div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">After Promotion</p><h3>Refresh production state</h3></div></div>
          <div className="prompt-box">npm run create:asset-intake</div>
          <div className="prompt-box">npm run sync:asset-previews</div>
          <div className="prompt-box">npm run create:review-summary</div>
          <div className="prompt-box">npm run create:studio-status</div>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Full Flow</p><h3>Candidate to official keyframe</h3></div></div>
        <div className="page-stack">
          <div className="dialogue-box">1. npm run register:candidate -- SHOT_ID IMAGE_FILE --tool manual</div>
          <div className="dialogue-box">2. npm run create:frame-qa</div>
          <div className="dialogue-box">3. inspect the frame visually</div>
          <div className="dialogue-box">4. npm run promote:candidate -- SHOT_ID --note approved</div>
          <div className="dialogue-box">5. npm run create:asset-intake && npm run sync:asset-previews</div>
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Known Targets</p><h3>Official keyframe paths</h3></div></div>
        <div className="page-stack">
          {briefs.map((brief) => (
            <div className="dialogue-box" key={brief.tv_shot_id}>
              <p className="eyebrow">P{brief.priority} · {brief.scene_id}</p>
              <p>{brief.tv_shot_id} · {brief.title}</p>
              <p>{brief.target_path}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
