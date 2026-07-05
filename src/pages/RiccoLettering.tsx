import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode } from '../data/riccoStudio';
import {
  buildRiccoDialogueScript,
  buildRiccoExportReadiness
} from '../domain/export/riccoExportState';
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

export function RiccoLettering() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
  }, []);

  const readiness = useMemo(() => buildRiccoExportReadiness(images), [images]);

  async function copyScript() {
    await navigator.clipboard.writeText(buildRiccoDialogueScript());
    setCopyStatus('Dialog-Skript kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function printPage() {
    window.print();
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card no-print">
        <p className="eyebrow">Ricco Lettering Preview v0.2</p>
        <h2>{riccoEpisode.title} · Comic-Seite prüfen</h2>
        <p className="body-copy">
          Diese Seite setzt Finalbilder und Dialog-Overlays in Reihenfolge zusammen. Version 0.2 nutzt die gemeinsame Export-Domain-Schicht. Das ist noch kein freier Drag-and-Drop-Editor.
        </p>
        <div className="chips">
          <span>{readiness.finalCount}/{readiness.totalPanels} Finalbilder</span>
          <span>{readiness.isReady ? 'bereit für Lettering' : 'Finalbilder fehlen'}</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="ghost-link" href="#/ricco-image-review">Finalbilder prüfen</a>
          <a className="ghost-link" href="#/ricco-export">Export Gate öffnen</a>
          <button className="ghost-button" onClick={copyScript}>Dialog-Skript kopieren</button>
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

      <div className="lettering-sheet">
        <div className="lettering-title">
          <p>RICCO IM HAUS</p>
          <h2>Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        </div>

        {readiness.panelStates.map(({ panel, finalImage }) => (
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
            </div>

            <div className="lettering-copy">
              <p className="eyebrow">Panel {panel.panelNumber} · {panel.title}</p>
              <p>{panel.dialogue}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
