import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels } from '../data/riccoStudio';
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

function buildDialogueScript() {
  return riccoPanels
    .map((panel) => `Panel ${panel.panelNumber}: ${panel.title}\n${panel.dialogue}`)
    .join('\n\n---\n\n');
}

export function RiccoLettering() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
  }, []);

  const finalImagesByPanelId = useMemo(() => {
    const map = new Map<string, RiccoPanelImage>();

    for (const image of images) {
      if (image.selected) {
        map.set(image.panelId, image);
      }
    }

    return map;
  }, [images]);

  const finalCount = riccoPanels.filter((panel) => finalImagesByPanelId.has(panel.id)).length;
  const isReady = finalCount === riccoPanels.length;

  async function copyScript() {
    await navigator.clipboard.writeText(buildDialogueScript());
    setCopyStatus('Dialog-Skript kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function printPage() {
    window.print();
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card no-print">
        <p className="eyebrow">Ricco Lettering Preview v0.1</p>
        <h2>{riccoEpisode.title} · Comic-Seite prüfen</h2>
        <p className="body-copy">
          Diese Seite setzt Finalbilder und Dialog-Overlays in Reihenfolge zusammen. Das ist noch kein freier Drag-and-Drop-Editor, aber der erste echte Comic-Preview-Schritt.
        </p>
        <div className="chips">
          <span>{finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{isReady ? 'bereit für Lettering' : 'Finalbilder fehlen'}</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="ghost-link" href="#/ricco-image-review">Finalbilder prüfen</a>
          <a className="ghost-link" href="#/ricco-export">Export Gate öffnen</a>
          <button className="ghost-button" onClick={copyScript}>Dialog-Skript kopieren</button>
          <button className="primary-button" onClick={printPage}>Browser Print / PDF</button>
        </div>
      </div>

      {!isReady && (
        <div className="card warning-card no-print">
          <p className="eyebrow">Blocker</p>
          <h3>Es fehlen noch Finalbilder</h3>
          <p className="body-copy">Die Comic-Vorschau funktioniert, aber für einen sauberen Export braucht jedes der 8 Panels ein finales Bild.</p>
        </div>
      )}

      <div className="lettering-sheet">
        <div className="lettering-title">
          <p>RICCO IM HAUS</p>
          <h2>Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        </div>

        {riccoPanels.map((panel) => {
          const finalImage = finalImagesByPanelId.get(panel.id);

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
              </div>

              <div className="lettering-copy">
                <p className="eyebrow">Panel {panel.panelNumber} · {panel.title}</p>
                <p>{panel.dialogue}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
