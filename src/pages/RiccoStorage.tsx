import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildRiccoStorageReport,
  buildRiccoStorageReportText,
  bytesFromText,
  formatBytes,
  keepOnlyFinalReviewImages,
  removeLocalNonFinalReviewImages,
  STORAGE_DANGER_BYTES,
  STORAGE_WARNING_BYTES
} from '../domain/review/riccoReviewState';
import {
  readLocalGenerationJobs,
  RICCO_GENERATION_JOBS_STORAGE_KEY,
  RICCO_IMAGES_STORAGE_KEY
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
import type { RiccoPanelImage } from '../types/riccoReview';

function readRawStorage() {
  try {
    return window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function readRawGenerationJobsStorage() {
  try {
    return window.localStorage.getItem(RICCO_GENERATION_JOBS_STORAGE_KEY) ?? '';
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
  window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify(images));
}

export function RiccoStorage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [rawBytes, setRawBytes] = useState(0);
  const [generationJobBytes, setGenerationJobBytes] = useState(0);
  const [status, setStatus] = useState('');

  function refresh() {
    const raw = readRawStorage();
    const rawJobs = readRawGenerationJobsStorage();
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setRawBytes(bytesFromText(raw));
    setGenerationJobBytes(bytesFromText(rawJobs));
  }

  useEffect(() => {
    refresh();
  }, []);

  const report = useMemo(() => {
    return buildRiccoStorageReport({ images, generationJobs, rawBytes, generationJobBytes });
  }, [images, generationJobs, rawBytes, generationJobBytes]);

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

    const finalsOnly = keepOnlyFinalReviewImages(images);
    saveAndRefresh(finalsOnly, `${images.length - finalsOnly.length} nicht-finale Varianten gelöscht.`);
  }

  function removeLocalNonFinals() {
    const ok = window.confirm('Alle lokalen nicht-finalen Data-URL Bilder löschen? URL-Bilder und Finalbilder bleiben erhalten.');
    if (!ok) return;

    const nextImages = removeLocalNonFinalReviewImages(images);
    saveAndRefresh(nextImages, `${images.length - nextImages.length} lokale nicht-finale Bilder gelöscht.`);
  }

  function removeGenerationJobs() {
    const ok = window.confirm('Generation Queue aus dem Browser löschen? Bilder und Reviews bleiben erhalten. Vorher Package sichern.');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_GENERATION_JOBS_STORAGE_KEY);
    setStatus('Generation Queue gelöscht.');
    refresh();
  }

  function removeEverything() {
    const ok = window.confirm('Wirklich den kompletten Ricco Image Review Speicher und die Generation Queue löschen? Vorher Package sichern.');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_IMAGES_STORAGE_KEY);
    window.localStorage.removeItem(RICCO_GENERATION_JOBS_STORAGE_KEY);
    setStatus('Kompletter Review- und Queue-Speicher gelöscht.');
    refresh();
  }

  async function copyStorageReport() {
    await navigator.clipboard.writeText(buildRiccoStorageReportText({
      report,
      rawBytes,
      generationJobBytes,
      imageCount: images.length,
      generationJobCount: generationJobs.length
    }));
    setStatus('Storage Report kopiert.');
  }

  return (
    <section className="page-stack">
      <div className={report.level === 'danger' ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Storage Manager v0.3</p>
        <h2>Browser-Speicher kontrollieren</h2>
        <p className="body-copy">
          Lokale Uploads, Public-Asset-Links und Generation Jobs werden im Browser gespeichert. Diese Seite zeigt Speicherverbrauch, Finalbilder, Varianten und sichere Aufräum-Aktionen.
        </p>
        <div className="chips">
          <span>{formatBytes(report.totalBytes)} gesamt</span>
          <span>{formatBytes(rawBytes)} Bilder</span>
          <span>{formatBytes(generationJobBytes)} Jobs</span>
          <span>{report.level}</span>
          <span>{images.length} Bilder</span>
          <span>{generationJobs.length} Jobs</span>
          <span>{report.finalImages.length} Finalbilder</span>
          <span>{report.localImages.length} lokale Dateien</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={copyStorageReport}>Report kopieren</button>
          <button className="ghost-button" onClick={refresh}>Neu laden</button>
          <a className="ghost-link" href="#/ricco-package">Package sichern</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue</a>
          <a className="ghost-link" href="#/ricco-image-review">Review öffnen</a>
        </div>
      </div>

      <div className="grid four-col">
        <div className="card">
          <p className="eyebrow">Storage</p>
          <h3>{formatBytes(report.totalBytes)}</h3>
          <p className="body-copy">Warnung ab {formatBytes(STORAGE_WARNING_BYTES)}, Gefahr ab {formatBytes(STORAGE_DANGER_BYTES)}.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Final</p>
          <h3>{report.finalImages.length}/{riccoPanels.length}</h3>
          <p className="body-copy">Finale Bilder bleiben bei Cleanup erhalten.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Jobs</p>
          <h3>{generationJobs.length}</h3>
          <p className="body-copy">{report.importedJobs.length} Jobs wurden bereits als Asset importiert.</p>
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
          <p className="eyebrow">Queue Cleanup</p>
          <h3>Jobs leeren</h3>
          <p className="body-copy">Löscht nur die lokale Generation Queue. Bilder und Reviews bleiben erhalten.</p>
          <button className="ghost-button" onClick={removeGenerationJobs}>Generation Queue löschen</button>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Danger Zone</p>
          <h3>Alles löschen</h3>
          <p className="body-copy">Nur nutzen, wenn ein Ricco Package gesichert ist.</p>
          <button className="ghost-button" onClick={removeEverything}>Review + Queue löschen</button>
        </section>
      </div>

      <section className="card rule-card">
        <p className="eyebrow">Local Cleanup</p>
        <h3>Data-URLs reduzieren</h3>
        <p className="body-copy">Löscht nur lokale nicht-finale Uploads. Externe URLs, Public Assets, Jobs und Finalbilder bleiben.</p>
        <button className="ghost-button" onClick={removeLocalNonFinals}>Lokale nicht-finale Bilder löschen</button>
      </section>

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
              <span>{item.jobs.length} Jobs</span>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
