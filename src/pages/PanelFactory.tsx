import { characters, locations, panels, scenes } from '../data/pilotData';
import { buildPanelPrompt } from '../utils/promptBuilder';
import type { PanelStatus } from '../types/comic';

const boardColumns: { status: PanelStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'prompt_ready', label: 'Prompt Ready' },
  { status: 'rendered', label: 'Rendered' },
  { status: 'needs_fix', label: 'Needs Fix' },
  { status: 'approved', label: 'Approved' }
];

export function PanelFactory() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Panel Factory</p>
          <h2>Storyboard board from typed pilot data</h2>
        </div>
        <button className="primary-button">Build Prompt Pack</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Factory Rule</p>
        <h2>Clean frames first, dialogue later</h2>
        <p className="body-copy">Panels generate image prompts only. Dialogue stays outside the frame and is used later for voice, subtitles or layout.</p>
      </div>

      <div className="grid five-col panel-board">
        {boardColumns.map((column) => {
          const columnPanels = panels.filter((panel) => panel.status === column.status);

          return (
            <div className="card" key={column.status}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">{column.label}</p>
                  <h3>{columnPanels.length} panels</h3>
                </div>
              </div>

              <div className="page-stack compact-stack">
                {columnPanels.map((panel) => {
                  const scene = scenes.find((item) => item.id === panel.sceneId);
                  const location = scene ? locations.find((item) => item.id === scene.locationId) : undefined;
                  const sceneCharacters = scene
                    ? characters.filter((character) => scene.characterIds.includes(character.id))
                    : [];
                  const prompt = scene && location
                    ? buildPanelPrompt(panel, scene, sceneCharacters, location)
                    : 'Missing scene or location data.';
                  const isPlaceholder = panel.visualDescription.includes('placeholder');

                  return (
                    <article className="card prompt-card" key={panel.id}>
                      <div className="card-header">
                        <div>
                          <p className="eyebrow">{panel.id} · Scene {scene?.order ?? '?'}</p>
                          <h3>{scene?.title ?? panel.sceneId}</h3>
                        </div>
                        {isPlaceholder && <span className="status-badge status-needs_fix">Placeholder</span>}
                      </div>

                      <div className="shot-meta">
                        <span>{panel.shotType}</span>
                        <span>{panel.status}</span>
                        <span>{location?.name ?? 'No location'}</span>
                      </div>

                      <div className="spec-grid">
                        <div><span>Visual</span><p>{panel.visualDescription}</p></div>
                        <div><span>Action</span><p>{panel.action}</p></div>
                        <div><span>Mood</span><p>{panel.mood}</p></div>
                      </div>

                      {panel.dialogue && (
                        <div className="dialogue-box">
                          <p className="eyebrow">Dialogue Source</p>
                          <p>{panel.dialogue}</p>
                        </div>
                      )}

                      <label>Generated Prompt</label>
                      <textarea readOnly value={prompt} />
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
