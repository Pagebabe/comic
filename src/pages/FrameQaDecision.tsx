import qaTemplate from '../data/frameQaTemplate.json';
import pilotShotBriefs from '../data/pilotShotBriefs.json';

type ShotBrief = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
};

const briefs = (pilotShotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);
const template = qaTemplate as { decisions: string[]; scoring: { min_approval_score: number } };

export function FrameQaDecision() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Frame QA Decision</p>
          <h2>Manual Candidate Decision Layer</h2>
        </div>
        <button className="primary-button">Set Decision</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Decide whether a registered candidate can move forward.</h2>
        <p className="body-copy">This fills the gap between QA checklist and promotion. The decision updates the QA report, candidate registry and a decision receipt.</p>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Min Score</p><strong>{template.scoring.min_approval_score}</strong><span>approval guide</span></div></div>
        <div className="stat-card"><div><p>Decisions</p><strong>{template.decisions.length}</strong><span>allowed states</span></div></div>
        <div className="stat-card"><div><p>Targets</p><strong>{briefs.length}</strong><span>pilot frames</span></div></div>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Approve Candidate</p><h3>Good enough to promote</h3></div></div>
          <div className="prompt-box">npm run qa:set -- ep001_tv_009 approved_candidate 88 "clean Sami, no text, no logo"</div>
          <div className="prompt-box">npm run promote:candidate -- ep001_tv_009 --note approved-clean-sami</div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Needs Work</p><h3>Create a stronger frame plan</h3></div></div>
          <div className="prompt-box">npm run qa:set -- ep001_tv_009 retry_with_stronger_prompt 62 "cup logo and Sami too threatening"</div>
          <div className="prompt-box">npm run create:frame-plan</div>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Allowed Decisions</p><h3>Use exactly these values</h3></div></div>
        <div className="grid two-col">
          {template.decisions.map((decision) => (
            <div className="dialogue-box" key={decision}>{decision}</div>
          ))}
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Targets</p><h3>Common shot selectors</h3></div></div>
        <div className="page-stack">
          {briefs.map((brief) => (
            <div className="dialogue-box" key={brief.tv_shot_id}>
              <p className="eyebrow">P{brief.priority} · {brief.scene_id}</p>
              <p>{brief.tv_shot_id} · {brief.title}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
