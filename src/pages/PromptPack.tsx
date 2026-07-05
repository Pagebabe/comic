import { characters, locations, panels, scenes } from '../data/pilotData';
import { buildPromptPackJson, buildPromptPackMarkdown, sortPanelsByScene } from '../utils/promptPack';

export function PromptPack() {
  const sortedPanels = sortPanelsByScene(panels, scenes);
  const promptReadyCount = sortedPanels.filter((panel) => panel.status === 'prompt_ready').length;
  const markdownPack = buildPromptPackMarkdown({ panels, scenes, characters, locations });
  const jsonPack = buildPromptPackJson({ panels, scenes, characters, locations });

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Prompt Pack</p>
          <h2>Export-ready panel prompts</h2>
        </div>
        <a className="ghost-link" href="#/panel-factory">Back to Panel Factory</a>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card">
          <div>
            <p>Panels</p>
            <strong>{sortedPanels.length}</strong>
            <span>total storyboard records</span>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p>Prompt Ready</p>
            <strong>{promptReadyCount}</strong>
            <span>ready for render prep</span>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p>Scenes</p>
            <strong>{scenes.length}</strong>
            <span>ordered story beats</span>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p>Characters</p>
            <strong>{characters.length}</strong>
            <span>used in prompt builder</span>
          </div>
        </div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Render Gate</p>
        <h2>Use this before ComfyUI or RunPod</h2>
        <p className="body-copy">This page turns the typed pilot data into a stable prompt pack. The renderer should consume this layer later, not random one-off prompts.</p>
      </div>

      <div className="grid two-col">
        <article className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Markdown Pack</p>
              <h3>Human-readable render brief</h3>
            </div>
          </div>
          <textarea readOnly value={markdownPack} style={{ minHeight: '520px' }} />
        </article>

        <article className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">JSON Pack</p>
              <h3>Machine-readable prompt payload</h3>
            </div>
          </div>
          <textarea readOnly value={jsonPack} style={{ minHeight: '520px' }} />
        </article>
      </div>
    </section>
  );
}
