import pilotShotBriefs from '../data/pilotShotBriefs.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type Brief = {
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

const briefs = (pilotShotBriefs as Brief[]).slice().sort((a, b) => a.priority - b.priority);
const reviews = tvReviewQueue as ReviewItem[];
const reviewByShot = new Map(reviews.map((item) => [item.tv_shot_id, item]));
const nextBrief = briefs.find((brief) => reviewByShot.get(brief.tv_shot_id)?.status !== 'approved') ?? briefs[0];

export function WorkPacket() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Next Work Packet</p>
          <h2>One Packet for the Next Shot</h2>
        </div>
        <button className="primary-button">Create Packet</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Current Target</p>
        <h2>{nextBrief.tv_shot_id} · {nextBrief.title}</h2>
        <p className="body-copy">The generated packet contains prompt, negative prompt, hard rules, target path and the exact command chain.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create work packet</h3></div></div>
          <div className="prompt-box">npm run create:work-packet</div>
          <p className="body-copy">JSON: outputs/pilot/work-packet/ep001_next_work_packet.json</p>
          <p className="body-copy">Markdown: outputs/pilot/work-packet/ep001_next_work_packet.md</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Fast Path</p><h3>Main orchestrator</h3></div></div>
          <div className="prompt-box">npm run studio:next</div>
          <p className="body-copy">studio:next now creates the packet automatically.</p>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Packet Workflow</p><h3>Use this order</h3></div></div>
        <div className="page-stack">
          <div className="dialogue-box">1. Use packet prompt to create the image.</div>
          <div className="dialogue-box">2. npm run register:candidate -- SHOT_ID IMAGE_FILE --tool manual</div>
          <div className="dialogue-box">3. npm run create:frame-qa</div>
          <div className="dialogue-box">4. npm run qa:set -- SHOT_ID approved_candidate 85 "checked clean frame"</div>
          <div className="dialogue-box">5. npm run promote:candidate -- SHOT_ID --note approved</div>
          <div className="dialogue-box">6. npm run create:asset-intake && npm run sync:asset-previews</div>
          <div className="dialogue-box">7. npm run review:set -- approved SHOT_ID TARGET_PATH "approved clean frame"</div>
          <div className="dialogue-box">8. npm run studio:next</div>
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Known Targets</p><h3>Static review order</h3></div></div>
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
