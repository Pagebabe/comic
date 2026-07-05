import shotBriefs from '../data/pilotShotBriefs.json';

type Brief = {
  tv_shot_id: string;
  title: string;
  priority: number;
  target_path: string;
};

const briefs = (shotBriefs as Brief[]).slice().sort((a, b) => a.priority - b.priority);

export function FrameInbox() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Frame Inbox</p>
          <h2>Finished Keyframe Intake</h2>
        </div>
        <button className="primary-button">Next Frame</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Move finished renders into the pilot pipeline.</h2>
        <p className="body-copy">Use the local command below after creating a PNG/WebP/JPG for a shot. Review still decides whether the frame is usable.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Use shot ID plus image file</h3></div></div>
        <div className="prompt-box">npm run place:keyframe -- ep001_tv_009 IMAGE_FILE</div>
        <div className="prompt-box">npm run place:keyframe -- ep001_tv_009 IMAGE_FILE --replace</div>
      </article>

      <div className="grid two-col">
        <div className="dialogue-box">
          <p className="eyebrow">After Command</p>
          <p>• npm run create:asset-intake</p>
          <p>• npm run sync:asset-previews</p>
          <p>• npm run create:review-summary</p>
          <p>• npm run create:pipeline-overview</p>
        </div>
        <div className="dialogue-box">
          <p className="eyebrow">Review Rule</p>
          <p>• File exists does not mean approved.</p>
          <p>• Always check the frame in Asset Gallery.</p>
          <p>• Then run review:set approved or needs_fix.</p>
        </div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Target List</p><h3>Remaining keyframes</h3></div></div>
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
