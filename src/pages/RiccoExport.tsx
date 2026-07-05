import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels } from '../data/riccoStudio';

type RiccoPanelImage = {
  id: string;
  panelId: string;
  imageUrl: string;
  source: string;
  promptUsed: string;
  rating: number;
  continuityScore: number;
  notes: string;
  selected: boolean;
  createdAt: string;
};

const STORAGE_KEY = 'ricco-studio-images-v1';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

export function RiccoExport() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);

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
  const missingCount = riccoPanels.length - finalCount;
  const isReady = finalCount === riccoPanels.length;
  const progress = Math.round((finalCount / riccoPanels.length) * 100);

  return (
    <section className="page-stack">
      <div className={isReady ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Export Gate v0.1</p>
        <h2>{isReady ? 'Exportbereit' : 'Noch nicht exportbereit'}</h2>
        <p className="body-copy">
          {riccoEpisode.title}: {finalCount}/{riccoPanels.length} Panels haben ein finales Bild. Version 0.1 prüft die Reihenfolge. PNG/PDF-Export kommt danach.
        </p>
        <div className="chips">
          <span>{progress}% ready</span>
          <span>{missingCount} fehlend</span>
          <span>{images.length} gespeicherte Varianten</span>
        </div>
      </div>

      {!isReady && (
        <div className="card">
          <p className="eyebrow">Nächster Schritt</p>
          <h3>Finalbilder auswählen</h3>
          <p className="body-copy">Öffne Ricco Image Review und wähle pro Panel genau eine Variante als final aus.</p>
          <div className="review-actions">
            <a className="primary-button" href="#/ricco-image-review">Ricco Image Review öffnen</a>
          </div>
        </div>
      )}

      {isReady && (
        <div className="card">
          <p className="eyebrow">Nächster Schritt</p>
          <h3>Comic Editor / Lettering</h3>
          <p className="body-copy">Alle Finalbilder sind gewählt. Jetzt kann als nächstes ein einfacher Seitenlayout- und Sprechblasen-Editor gebaut werden.</p>
        </div>
      )}

      <div className="section-header">
        <div>
          <p className="eyebrow">Episode 1</p>
          <h2>Finalbild-Reihenfolge</h2>
        </div>
        <a className="ghost-link" href="#/ricco-studio">Prompts öffnen</a>
      </div>

      <div className="grid two-col">
        {riccoPanels.map((panel) => {
          const finalImage = finalImagesByPanelId.get(panel.id);

          return (
            <article className="card export-card" key={panel.id} style={finalImage ? { borderColor: 'rgba(120,255,170,0.32)' } : undefined}>
              <div className="mock-preview image-preview" style={finalImage ? { backgroundImage: `url(${finalImage.imageUrl})` } : undefined}>
                <span>Panel {panel.panelNumber}</span>
                <strong>{finalImage ? 'FINAL' : 'MISSING'}</strong>
              </div>

              <div className="card-header">
                <div>
                  <p className="eyebrow">{panel.id}</p>
                  <h3>{panel.title}</h3>
                </div>
                <span className={`status-badge ${finalImage ? 'status-active' : 'status-needs_fix'}`}>
                  {finalImage ? 'ready' : 'missing'}
                </span>
              </div>

              <p className="body-copy">{panel.action}</p>

              <div className="dialogue-box">
                <p className="eyebrow">Dialogue Overlay</p>
                <p>{panel.dialogue}</p>
              </div>

              {finalImage ? (
                <div className="chips">
                  <span>Rating {finalImage.rating || '—'}</span>
                  <span>Continuity {finalImage.continuityScore || '—'}</span>
                  <span>{finalImage.source}</span>
                </div>
              ) : (
                <div className="review-actions">
                  <a className="ghost-link" href="#/ricco-image-review">Finalbild wählen</a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
