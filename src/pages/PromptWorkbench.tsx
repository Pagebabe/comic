import shotBriefs from '../data/pilotShotBriefs.json';
import template from '../data/promptExportTemplate.json';

type ShotBrief = {
  id: string;
  tv_shot_id: string;
  scene_id: string;
  title: string;
  priority: number;
  target_path: string;
  clean_prompt: string;
  negative_prompt: string;
};

const briefs = (shotBriefs as ShotBrief[]).slice().sort((a, b) => a.priority - b.priority);
const exportTemplate = template as { output_root: string; index_output: string; rules: string[] };

export function PromptWorkbench() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Prompt Workbench</p>
          <h2>External Render Prompt Files</h2>
        </div>
        <button className="primary-button">Export Prompts</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Shots</p><strong>{briefs.length}</strong><span>prompt exports</span></div></div>
        <div className="stat-card"><div><p>Text Files</p><strong>{briefs.length * 2}</strong><span>clean + negative</span></div></div>
        <div className="stat-card"><div><p>Output</p><strong>prompts</strong><span>{exportTemplate.output_root}</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Rule</p>
        <h2>Prompt export is not approval.</h2>
        <p className="body-copy">Rendered images still need Asset Intake, Gallery sync and Review approval before they can enter assembly.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Export all prompt files</h3></div></div>
        <div className="prompt-box">npm run create:prompt-files</div>
        <p className="body-copy">Index: {exportTemplate.index_output}</p>
      </article>

      <div className="page-stack">
        {briefs.map((brief) => {
          const base = `${brief.priority}_${brief.tv_shot_id}`;
          return (
            <article className="card" key={brief.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">P{brief.priority} · {brief.scene_id}</p>
                  <h3>{brief.tv_shot_id} · {brief.title}</h3>
                </div>
                <span className="status-badge">export</span>
              </div>

              <div className="spec-grid">
                <div><span>Clean Prompt File</span><p>{exportTemplate.output_root}/{base}_clean_prompt.txt</p></div>
                <div><span>Negative Prompt File</span><p>{exportTemplate.output_root}/{base}_negative_prompt.txt</p></div>
                <div><span>Target Asset</span><p>{brief.target_path}</p></div>
              </div>

              <div className="grid two-col">
                <div>
                  <label>Clean Prompt</label>
                  <textarea readOnly value={brief.clean_prompt} />
                </div>
                <div>
                  <label>Negative Prompt</label>
                  <textarea readOnly value={brief.negative_prompt} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
