import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';

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
const WARNING_BYTES = 3_500_000;
const DANGER_BYTES = 4_500_000;

function readRawStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = readRawStorage();
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function writeStoredImages(images: RiccoPanelImage[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

function bytesFromText(value: string) {
  return new Blob([value]).size;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function isLocalDataUrl(image: RiccoPanelImage) {
  return image.imageUrl.startsWith('data:image/');
}

function storageLevel(bytes: number) {
  if (bytes >= DANGER_BYTES) return 'danger';
  if (bytes >= WARNING_BYTES) return 'warning';
  return 'ok';
}

export function RiccoStorage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [rawBytes, setRawBytes] = useState(0);
  const [status, setStatus] = useState('');

  function refresh() {
    const raw = readRawStorage();
    setImages(readStoredImages());
    setRawBytes(bytesFromText(raw));
  }

  useEffect(() => {
    refresh();
  }, []);

  const report = useMemo(() => {
    const finalImages = images.filter((image) => image.selected);
    const localImages = images.filter(isLocalDataUrl);
    const urlImages = images.filter((image) => !isLocalDataUrl(image));
    const nonFinalImages = images.filter((image) => !image.selected);
    const finalPanelIds = new Set(finalImages.map((image) => image.panelId));
    const missingFinals = riccoPanels.filter((panel) => !finalPanelIds.has(panel.id));

    const byPanel = riccoPanels.map((panel) => ({
      panel,
      images: images.filter((image) => image.panelId === panel.id),
      finals: images.filter((image) => image.panelId === panel.id && image.selected),
      variants: images.filter((image) => image.panelId === panel.id && !image.selected)
    }));

    return {
      finalImages,
      localImages,
      urlImages,
      nonFinalImages,
      missingFinals,
      byPanel,
      level: storageLevel(rawBytes)
    };
  }, [images, rawBytes]);

  function saveAndRefresh(nextImages: RiccoPanelImage[], nextStatus: string) {
    try {
      writeStoredImages(nextImages);
      setStatus(nextStatus);
      refresh();
    } catch {
      setStatus('Speichern fehlgeschlagen. Browser-Speicher ist wahrscheinlich voll.');
    }
  }

  function removeNonFinals() {
    const ok = window.confirm('Alle nicht-finalen Bildvarianten löschen? Finalbilder bleiben erhalten. Vorher am besten Ricco Package sichern.');
    if (!ok) return;

    const finalsOnly = images.filter((image) => image.selected);
    saveAndRefresh(finalsOnly, `${images.length - finalsOnly.length} nicht-finale Varianten gelöscht.`);
  }

  function removeLocalNonFinals() {
    const ok = window.confirm('Alle lokalen nicht-finalen Data-URL Bilder löschen? URL-Bilder und Finalbilder bleiben erhalten.');
    if (!ok) return;

    const nextImages = images.filter((image) => image.selected || !isLocalDataUrl(image));
    saveAndRefresh(nextImages, `${images.length - nextImages.length} lokale nicht-finale Bilder gelöscht.`);
  }

  function removeEverything() {
    const ok = window.confirm('Wirklich den kompletten Ricco Image Review Speicher löschen? Vorher Package sichern.');
    if (!ok) return;

    window.localStorage.removeItem(STORAGE_KEY);
    setStatus('Kompletter Review-Speicher gelöscht.');
    refresh();
  }

  async function copyStorageReport() {
    const lines = [
      'Ricco Storage Report',
      `Storage: ${formatBytes(rawBytes)} (${report.level})`,
      `Images: ${images.length}`,
      `Final images: ${report.finalImages.length}`,
      `Local Data-URL images: ${report.localImages.length}`,
      `URL images: ${report.urlImages.length}`,
      `Non-final variants: ${report.nonFinalImages.length}`,
      `Missing finals: ${report.missingFinals.map((panel) => `Panel ${panel.panelNumber}`).join(', ') || 'none'}`,
      '',
      'By panel:',
      ...report.byPanel.map((item) => `Panel ${item.panel.panelNumber}: ${item.panel.title} — ${item.images.length} images, ${item.finals.length} final, ${item.variants.length} variants`)
    ];

    await navigator.clipboard.writeText(lines.join('\n'));
    setStatus('Storage Report kopiert.');
  }

  return (
    <section className="page-stack">
      <div className={report.level === 'danger' ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Storage Manager v0.1</p>
        <h2>Browser-Speicher kontrollieren</h2>
        <p className="body-copy">
          Lokale Uploads werden als Data-URLs im Browser gespeichert. Diese Seite zeigt Speicherverbrauch, Finalbilder, Varianten und sichere Aufräum-Aktionen.
        </p>
        <div className="chips">
          <span>{formatBytes(rawBytes)} genutzt</span>
          <span>{report.level}</span>
          <span>{images.length} Bilder</span>
          <span>{report.finalImages.length} Finalbilder</span>
          <span>{report.localImages.length} lokale Dateien</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={copyStorageReport}>Report kopieren</button>
          <button className="ghost-button" onClick={refresh}>Neu laden</button>
          <a className="ghost-link" href="#/ricco-package">Package sichern</a>
          <a className="ghost-link" href="#/ricco-image-review">Review öffnen</a>
        </div>
      </div>

      <div className="grid four-col">
        <div className="card">
          <p className="eyebrow">Storage</p>
          <h3>{formatBytes(rawBytes)}</h3>
          <p className="body-copy">Warnung ab {formatBytes(WARNING_BYTES)}, Gefahr ab {formatBytes(DANGER_BYTES)}.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Final</p>
          <h3>{report.finalImages.length}/{riccoPanels.length}</h3>
          <p className="body-copy">Finale Bilder bleiben bei Cleanup erhalten.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Varianten</p>
          <h3>{report.nonFinalImages.length}</h3>
          <p className="body-copy">Diese belasten den Speicher am stärksten.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Missing</p>
          <h3>{report.missingFinals.length}</h3>
          <p className="body-copy">Panels ohne Finalbild.</p>
        </div>
      </div>

      <div className="grid three-col">
        <section className="card rule-card">
          <p className="eyebrow">Safe Cleanup</p>
          <h3>Nur Müll raus</h3>
          <p className="body-copy">Löscht nicht-finale Varianten. Finalbilder bleiben erhalten.</p>
          <button className="primary-button" onClick={removeNonFinals}>Nicht-finale Varianten löschen</button>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Local Cleanup</p>
          <h3>Data-URLs reduzieren</h3>
          <p className="body-copy">Löscht nur lokale nicht-finale Uploads. Externe URLs und Finalbilder bleiben.</p>
          <button className="ghost-button" onClick={removeLocalNonFinals}>Lokale nicht-finale Bilder löschen</button>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Danger Zone</p>
          <h3>Alles löschen</h3>
          <p className="body-copy">Nur nutzen, wenn ein Ricco Package gesichert ist.</p>
          <button className="ghost-button" onClick={removeEverything}>Kompletten Review-Speicher löschen</button>
        </section>
      </div>

      <section className="page-stack compact-stack">
        <div className="section-header">
          <div>
            <p className="eyebrow">Panel Übersicht</p>
            <h2>Speicher nach Panels</h2>
          </div>
          <a className="ghost-link" href="#/ricco-qa">Gate prüfen</a>
        </div>

        {report.byPanel.map((item) => (
          <article className="card" key={item.panel.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {item.panel.panelNumber}</p>
                <h3>{item.panel.title}</h3>
              </div>
              <span className={`status-badge ${item.finals.length > 0 ? 'status-active' : 'status-needs_fix'}`}>
                {item.finals.length > 0 ? 'final' : 'missing'}
              </span>
            </div>
            <div className="chips">
              <span>{item.images.length} Bilder</span>
              <span>{item.finals.length} Final</span>
              <span>{item.variants.length} Varianten</span>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
