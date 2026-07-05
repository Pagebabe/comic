import { useMemo, useState } from 'react';
import {
  buildAllRiccoPanelPrompts,
  buildRiccoPanelPrompt,
  riccoCharacters,
  riccoEpisode,
  riccoLocations,
  riccoPanels,
  riccoSeries,
  type RiccoPromptResult
} from '../data/riccoStudio';

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

function statusLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function RiccoStudio() {
  const [selectedPanelId, setSelectedPanelId] = useState(riccoPanels[0]?.id ?? '');
  const [generatedPrompts, setGeneratedPrompts] = useState<Record<string, RiccoPromptResult>>({});
  const [copyStatus, setCopyStatus] = useState('');

  const selectedPanel = useMemo(() => {
    return riccoPanels.find((panel) => panel.id === selectedPanelId) ?? riccoPanels[0];
  }, [selectedPanelId]);

  const selectedPrompt = selectedPanel ? generatedPrompts[selectedPanel.id] : undefined;
  const activeCharacters = riccoCharacters.filter((character) => character.status === 'active');
  const activeLocations = riccoLocations.filter((location) => location.status === 'active');
  const generatedCount = Object.keys(generatedPrompts).length;

  function generateOne(panelId: string) {
    const result = buildRiccoPanelPrompt(panelId);
    setGeneratedPrompts((current) => ({ ...current, [panelId]: result }));
    setSelectedPanelId(panelId);
  }

  function generateAll() {
    const results = buildAllRiccoPanelPrompts();
    const mapped = results.reduce<Record<string, RiccoPromptResult>>((acc, item) => {
      acc[item.panelId] = item;
      return acc;
    }, {});

    setGeneratedPrompts(mapped);
    setSelectedPanelId(results[0]?.panelId ?? riccoPanels[0]?.id ?? '');
  }

  async function copy(value: string, label: string) {
    await copyText(value);
    setCopyStatus(`${label} kopiert`);
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Studio v0.1</p>
        <h2>{riccoSeries.title}</h2>
        <p className="body-copy">{riccoSeries.logline}</p>
        <div className="chips">
          <span>{activeCharacters.length} Characters</span>
          <span>{activeLocations.length} Locations</span>
          <span>{riccoEpisode.panelCount} Panels</span>
          <span>{generatedCount}/{riccoPanels.length} Prompts generated</span>
        </div>
      </div>

      <div className="grid stats-grid">
        <div className="card">
          <p className="eyebrow">Serie</p>
          <h3>{riccoSeries.status}</h3>
          <p className="body-copy">{riccoSeries.tone}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Episode</p>
          <h3>#{riccoEpisode.episodeNumber} {riccoEpisode.title}</h3>
          <p className="body-copy">{riccoEpisode.mainConflict}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Prompt Gate</p>
          <h3>{generatedCount === riccoPanels.length ? 'ready' : 'open'}</h3>
          <p className="body-copy">Erst Prompts stabil machen, dann Bilder extern generieren, dann Review.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Hard Rule</p>
          <h3>No text in image</h3>
          <p className="body-copy">Keine Sprechblasen, kein Dialogtext, keine Fake-Lettering-Artefakte im Bild.</p>
        </div>
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Pilotfolge</p>
          <h2>Panel Board · {riccoEpisode.title}</h2>
        </div>
        <button className="primary-button" onClick={generateAll}>Alle Prompts erzeugen</button>
      </div>

      <div className="grid two-col">
        <div className="page-stack compact-stack">
          {riccoPanels.map((panel) => {
            const promptReady = Boolean(generatedPrompts[panel.id]);
            const isSelected = selectedPanel?.id === panel.id;

            return (
              <article className="card" key={panel.id} style={isSelected ? { borderColor: 'rgba(255,207,90,0.42)' } : undefined}>
                <div className="card-header">
                  <div>
                    <p className="eyebrow">Panel {panel.panelNumber}</p>
                    <h3>{panel.title}</h3>
                  </div>
                  <span className={`status-badge ${promptReady ? 'status-active' : ''}`}>
                    {promptReady ? 'prompt ready' : statusLabel(panel.status)}
                  </span>
                </div>

                <div className="shot-meta">
                  <span>{panel.camera}</span>
                  <span>{panel.mood}</span>
                </div>

                <p className="body-copy">{panel.action}</p>

                <div className="dialogue-box">
                  <p className="eyebrow">Dialogue Overlay</p>
                  <p>{panel.dialogue}</p>
                </div>

                <div className="review-actions">
                  <button className="ghost-button" onClick={() => setSelectedPanelId(panel.id)}>Ansehen</button>
                  <button className="primary-button" onClick={() => generateOne(panel.id)}>
                    {promptReady ? 'Neu erzeugen' : 'Prompt erzeugen'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="card prompt-card sticky-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Prompt Builder</p>
              <h3>{selectedPanel ? `Panel ${selectedPanel.panelNumber}: ${selectedPanel.title}` : 'Kein Panel'}</h3>
            </div>
            {copyStatus && <span className="status-badge status-active">{copyStatus}</span>}
          </div>

          {!selectedPanel && <p className="body-copy">Kein Panel ausgewählt.</p>}

          {selectedPanel && !selectedPrompt && (
            <div className="prompt-box">Für dieses Panel wurde noch kein Prompt erzeugt.</div>
          )}

          {selectedPrompt && (
            <div className="page-stack compact-stack">
              <div>
                <div className="card-header">
                  <label>Positive Prompt</label>
                  <button className="ghost-button" onClick={() => copy(selectedPrompt.positivePrompt, 'Positive Prompt')}>Copy</button>
                </div>
                <textarea readOnly value={selectedPrompt.positivePrompt} />
              </div>

              <div>
                <div className="card-header">
                  <label>Negative Prompt</label>
                  <button className="ghost-button" onClick={() => copy(selectedPrompt.negativePrompt, 'Negative Prompt')}>Copy</button>
                </div>
                <textarea readOnly value={selectedPrompt.negativePrompt} />
              </div>

              <div>
                <div className="card-header">
                  <label>Continuity Checklist</label>
                  <button className="ghost-button" onClick={() => copy(selectedPrompt.continuityChecklist.join('\n'), 'Continuity Checklist')}>Copy</button>
                </div>
                <textarea readOnly value={selectedPrompt.continuityChecklist.join('\n')} />
              </div>

              <div>
                <div className="card-header">
                  <label>Dialogue Overlay</label>
                  <button className="ghost-button" onClick={() => copy(selectedPrompt.dialogueOverlay, 'Dialogue Overlay')}>Copy</button>
                </div>
                <textarea readOnly value={selectedPrompt.dialogueOverlay} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
