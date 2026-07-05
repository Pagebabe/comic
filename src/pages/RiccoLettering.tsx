import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode } from '../data/riccoStudio';
import { buildRiccoExportReadiness } from '../domain/export/riccoExportState';
import {
  buildLetteringScriptFromLayout,
  BUBBLE_PRESETS,
  normalizeRiccoLetteringLayoutState,
  resetPanelLetteringLayout,
  RICCO_LETTERING_STORAGE_KEY,
  updatePanelLetteringLayout,
  type BubblePositionPreset,
  type RiccoLetteringLayoutState
} from '../domain/lettering/riccoLetteringLayout';
import { RICCO_IMAGES_STORAGE_KEY } from '../lib/backend/localProductionStore';
import type { RiccoPanelImage } from '../types/riccoReview';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function readLetteringLayout(): RiccoLetteringLayoutState {
  try {
    const raw = window.localStorage.getItem(RICCO_LETTERING_STORAGE_KEY);
    return normalizeRiccoLetteringLayoutState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeRiccoLetteringLayoutState({});
  }
}

export function RiccoLettering() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [layoutState, setLayoutState] = useState<RiccoLetteringLayoutState>(() => normalizeRiccoLetteringLayoutState({}));
  const [selectedPanelId, setSelectedPanelId] = useState('panel_001');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
    setLayoutState(readLetteringLayout());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(RICCO_LETTERING_STORAGE_KEY, JSON.stringify(layoutState));
    } catch {
      setCopyStatus('Lettering Layout konnte nicht gespeichert werden');
    }
  }, [layoutState]);

  const readiness = useMemo(() => buildRiccoExportReadiness(images), [images]);
  const selectedPanelState = readiness.panelStates.find(({ panel }) => panel.id === selectedPanelId) ?? readiness.panelStates[0];
  const selectedLayout = selectedPanelState ? layoutState[selectedPanelState.panel.id] : undefined;

  async function copyScript() {
    await navigator.clipboard.writeText(buildLetteringScriptFromLayout(layoutState));
    setCopyStatus('Dialog-Skript kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function printPage() {
    window.print();
  }

  function updateSelectedLayout(patch: Parameters<typeof updatePanelLetteringLayout>[2]) {
    if (!selectedPanelState) return;
    setLayoutState((current) => updatePanelLetteringLayout(current, selectedPanelState.panel.id, patch));
  }

  function resetSelectedLayout() {
    if (!selectedPanelState) return;
    setLayoutState((current) => resetPanelLetteringLayout(current, selectedPanelState.panel.id));
  }

  function resetAllLayouts() {
    const ok = window.confirm('Alle Lettering-Layouts und geänderten Texte zurücksetzen?');
    if (!ok) return;
    setLayoutState(normalizeRiccoLetteringLayoutState({}));
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card no-print">
        <p className="eyebrow">Ricco Lettering Editor v0.3</p>
        <h2>{riccoEpisode.title} · Bubble-Layout setzen</h2>
        <p className="body-copy">
          Erste echte Lettering-Stufe: Dialogtext pro Panel editieren, Bubble-Position wählen, Koordinaten/Größe/Schrift einstellen und als Print/PDF previewen. Noch kein Drag-and-Drop, aber ein speicherbarer Studio-Editor.
        </p>
        <div className="chips">
          <span>{readiness.finalCount}/{readiness.totalPanels} Finalbilder</span>
          <span>{readiness.isReady ? 'bereit für Lettering' : 'Finalbilder fehlen'}</span>
          <span>{Object.keys(layoutState).length} Layouts</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="ghost-link" href="#/ricco-image-review">Finalbilder prüfen</a>
          <a className="ghost-link" href="#/ricco-export">Export Gate öffnen</a>
          <button className="ghost-button" onClick={copyScript}>Dialog-Skript kopieren</button>
          <button className="ghost-button" onClick={resetAllLayouts}>Alle Layouts resetten</button>
          <button className="primary-button" onClick={printPage}>Browser Print / PDF</button>
        </div>
      </div>

      {!readiness.isReady && (
        <div className="card warning-card no-print">
          <p className="eyebrow">Blocker</p>
          <h3>Es fehlen noch Finalbilder</h3>
          <p className="body-copy">Die Comic-Vorschau funktioniert, aber für einen sauberen Export braucht jedes der {readiness.totalPanels} Panels ein finales Bild.</p>
        </div>
      )}

      {selectedPanelState && selectedLayout && (
        <section className="card no-print">
          <div className="card-header">
            <div>
              <p className="eyebrow">Bubble Editor</p>
              <h3>Panel {selectedPanelState.panel.panelNumber}: {selectedPanelState.panel.title}</h3>
            </div>
            <button className="ghost-button" onClick={resetSelectedLayout}>Panel resetten</button>
          </div>

          <div className="grid two-col">
            <div>
              <label>Panel</label>
              <select value={selectedPanelId} onChange={(event) => setSelectedPanelId(event.target.value)}>
                {readiness.panelStates.map(({ panel, finalImage }) => (
                  <option key={panel.id} value={panel.id}>Panel {panel.panelNumber}: {panel.title}{finalImage ? ' ✓' : ' — fehlt'}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Preset</label>
              <select value={selectedLayout.preset} onChange={(event) => updateSelectedLayout({ preset: event.target.value as BubblePositionPreset })}>
                {Object.keys(BUBBLE_PRESETS).map((preset) => <option key={preset} value={preset}>{preset}</option>)}
              </select>
            </div>
          </div>

          <label>Dialog / Caption</label>
          <textarea value={selectedLayout.text} onChange={(event) => updateSelectedLayout({ text: event.target.value })} />

          <div className="grid four-col">
            <NumberControl label="X %" value={selectedLayout.x} min={0} max={92} onChange={(value) => updateSelectedLayout({ x: value })} />
            <NumberControl label="Y %" value={selectedLayout.y} min={0} max={92} onChange={(value) => updateSelectedLayout({ y: value })} />
            <NumberControl label="Breite %" value={selectedLayout.width} min={20} max={94} onChange={(value) => updateSelectedLayout({ width: value })} />
            <NumberControl label="Font" value={selectedLayout.fontSize} min={10} max={28} onChange={(value) => updateSelectedLayout({ fontSize: value })} />
          </div>
        </section>
      )}

      <div className="lettering-sheet">
        <div className="lettering-title">
          <p>RICCO IM HAUS</p>
          <h2>Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        </div>

        {readiness.panelStates.map(({ panel, finalImage }) => {
          const layout = layoutState[panel.id];

          return (
            <article className="lettering-panel" key={panel.id}>
              <div className="lettering-image-wrap">
                {finalImage ? (
                  <img className="lettering-image" src={finalImage.imageUrl} alt={`Panel ${panel.panelNumber}: ${panel.title}`} />
                ) : (
                  <div className="lettering-missing">
                    <span>Panel {panel.panelNumber}</span>
                    <strong>Finalbild fehlt</strong>
                  </div>
                )}

                {layout && (
                  <div
                    className={`lettering-bubble lettering-bubble-${layout.preset}`}
                    style={{
                      left: `${layout.x}%`,
                      top: `${layout.y}%`,
                      width: `${layout.width}%`,
                      fontSize: `${layout.fontSize}px`
                    }}
                  >
                    {layout.text}
                  </div>
                )}
              </div>

              <div className="lettering-copy">
                <p className="eyebrow">Panel {panel.panelNumber} · {panel.title}</p>
                <p>{layout?.text ?? panel.dialogue}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label>{label}</label>
      <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
