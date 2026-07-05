import template from '../data/frameCandidateTemplate.json';
import qaTemplate from '../data/frameQaTemplate.json';
import pilotShotBriefs from '../data/pilotShotBriefs.json';

type ShotBrief = {
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
};

const briefs = (pilotShotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);
const registryTemplate = template as { output: string; rules: string[]; statuses: string[] };
const checksTemplate = qaTemplate as { output: string; checks: { id: string; label: string; weight: number }[]; scoring: { min_approval_score: number } };

export function FrameRegistry() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Frame Registry</p>
          <h2>Versioned Keyframe Candidates</h2>
        </div>
        <button className="primary-button">Register Frame</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Track every keyframe version before it becomes official.</h2>
        <p className="body-copy">This keeps source file, candidate file, target path, notes and review status together.</p>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Open Briefs</p><strong>{briefs.length}</strong><span>remaining targets</span></div></div>
        <div className="stat-card"><div><p>Checks</p><strong>{checksTemplate.checks.length}</strong><span>per frame</span></div></div>
        <div className="stat-card"><div><p>Min Score</p><strong>{checksTemplate.scoring.min_approval_score}</strong><span>approval guide</span></div></div>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Register</p><h3>Local command</h3></div></div>
          <div className="prompt-box">npm run register:candidate -- ep001_tv_009 IMAGE_FILE --tool manual</div>
          <div className="prompt-box">npm run register:candidate -- ep001_tv_009 IMAGE_FILE --tool manual --promote</div>
          <p className="body-copy">Registry: {registryTemplate.output}</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Checklist</p><h3>Create frame QA report</h3></div></div>
          <div className="prompt-box">npm run create:frame-qa</div>
          <p className="body-copy">Output: {checksTemplate.output}</p>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Checks</p><h3>Before approval</h3></div></div>
        <div className="grid two-col">
          {checksTemplate.checks.map((check) => (
            <div className="dialogue-box" key={check.id}>
              <p className="eyebrow">{check.weight} pts</p>
              <p>{check.label}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Targets</p><h3>Use these first</h3></div></div>
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
