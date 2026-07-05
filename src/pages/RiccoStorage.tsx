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
  buildRiccoImageStorageSplit,
  readLocalGenerationJobs,
  readRiccoReviewImages,
  RICCO_GENERATION_JOBS_STORAGE_KEY,
  RICCO_IMAGES_STORAGE_KEY,
  writeRiccoImageStorageSplit,
  writeRiccoReviewImages
} from '../lib/backend/localProductionStore';
import {
  clearRiccoImageBlobsFromIndexedDb,
  isRiccoIndexedDbAvailable,
  readRiccoImageBlobsFromIndexedDb,
  writeRiccoImageBlobsToIndexedDb
} from '../lib/storage/riccoIndexedDbStorage';
import { buildRiccoImageStorageReport } from '../lib/storage/riccoStoragePort';
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

function writeStoredImages(images: RiccoPanelImage[]) {
  writeRiccoReviewImages(images);
}

export function RiccoStorage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [rawBytes, setRawBytes] = useState(0);
  const [generationJobBytes, setGenerationJobBytes] = useState(0);
  const [indexedDbBlobCount, setIndexedDbBlobCount] = useState(0);
  const [indexedDbBytes, setIndexedDbBytes] = useState(0);
  const [status, setStatus] = useState('');

  function refresh() {
    const raw = readRawStorage();
    const rawJobs = readRawGenerationJobsStorage();
    setImages(readRiccoReviewImages());
    setGenerationJobs(readLocalGenerationJobs());
    setRawBytes(bytesFromText(raw));
    setGenerationJobBytes(bytesFromText(rawJobs));
    refreshIndexedDbStatus();
  }

  async function refreshIndexedDbStatus() {
    const blobs = await readRiccoImageBlobsFromIndexedDb();
    setIndexedDbBlobCount(blobs.length);
    setIndexedDbBytes(blobs.reduce((sum, blob) => sum + blob.sizeBytes, 0));
  }

  useEffect(() => {
    refresh();
  }, []);

  const report = useMemo(() => {
    return buildRiccoStorageReport({ images, generationJobs, rawBytes, generationJobBytes });
  }, [images, generationJobs, rawBytes, generationJobBytes]);

  const splitPreview = useMemo(() => buildRiccoImageStorageSplit(images), [images]);
  const indexedDbAvailable = isRiccoIndexedDbAvailable();

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

  async function copySplitReport() {
    await navigator.clipboard.writeText(buildRiccoImageStorageReport(splitPreview));
    setStatus('Storage Split Report kopiert.');
  }

  function writeSplitPreview() {
    const result = writeRiccoImageStorageSplit(images);
    setStatus(result.ok
      ? `Split geschrieben: ${result.split.summary.blobRefImages} Blob-Refs, ${formatBytes(result.split.summary.blobBytes)} ausgelagerte Data-URLs.`
      : 'Split konnte nicht geschrieben werden. Browser-Speicher prüfen.');
    refresh();
  }

  async function migrateSplitBlobsToIndexedDb() {
    const result = await writeRiccoImageBlobsToIndexedDb(splitPreview.imageBlobs);
    setStatus(result.available
      ? `IndexedDB Migration: ${result.written}/${result.attempted} Blob-Records geschrieben (${formatBytes(result.totalBytes)}).`
      : 'IndexedDB ist in diesem Browser-Kontext nicht verfügbar.');
    await refreshIndexedDbStatus();
  }

  async function clearIndexedDbBlobs() {
    const ok = window.confirm('IndexedDB Bild-Blob-Records löschen? Alte localStorage Review-Bilder bleiben erhalten.');
    if (!ok) return;

    const cleared = await clearRiccoImageBlobsFromIndexedDb();
    setStatus(cleared ? 'IndexedDB Blob-Store gelöscht.' : 'IndexedDB Blob-Store konnte nicht gelöscht werden.');
    await refreshIndexedDbStatus();
  }

  return (
    <section className="page-stack">
      <div className={report.level === 'danger' ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Storage Manager v0.5</p>
        <h2>Browser-Speicher kontrollieren</h2>
        <p className="body-copy">
          Lokale Uploads, Public-Asset-Links und Generation Jobs werden im Browser gespeichert. Diese Seite zeigt Speicherverbrauch, Finalbilder, Varianten, sichere Aufräum-Aktionen, Storage-Split und IndexedDB-Blob-Migration.
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
          <span>{splitPreview.summary.localDataUrlImages} Data-URLs splittbar</span>
          <span>{formatBytes(splitPreview.summary.blobBytes)} Blob-Payload</span>
          <span>IndexedDB {indexedDbAvailable ? 'available' : 'unavailable'}</span>
          <span>{indexedDbBlobCount} IDB Blobs</span>
          <span>{formatBytes(indexedDbBytes)} IDB Bytes</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={copyStorageReport}>Report kopieren</button>
          <button className="ghost-button" onClick={copySplitReport}>Split Report kopieren</button>
          <button className="ghost-button" onClick={writeSplitPreview}>Split-Daten schreiben</button>
          <button className="ghost-button" onClick={migrateSplitBlobsToIndexedDb}>Blobs nach IndexedDB</button>
          <button className="ghost-button" onClick={clearIndexedDbBlobs}>IndexedDB Blobs löschen</button>
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
          <p className="eyebrow">IndexedDB</p>
          <h3>{indexedDbBlobCount}</h3>
          <p className="body-copy">Blob-Records im IndexedDB Store. Payload: {formatBytes(indexedDbBytes)}.</p>
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Storage Adapter v0.1</p>
            <h3>Metadaten / Bilddaten Split</h3>
          </div>
          <span className="status-badge status-needs_fix">prep</span>
        </div>
        <p className="body-copy">
          Dieser Schritt löscht noch keine alten Review-Bilder. Er schreibt eine vorbereitete Split-Struktur: Bild-Metadaten separat, lokale Data-URLs als Blob-Records. Danach können die Blob-Records testweise in IndexedDB geschrieben werden.
        </p>
        <div className="chips">
          <span>{splitPreview.summary.totalImages} total</span>
          <span>{splitPreview.summary.urlImages} URL/Public</span>
          <span>{splitPreview.summary.localDataUrlImages} lokale Data-URLs</span>
          <span>{splitPreview.summary.blobRefImages} Blob-Refs</span>
          <span>{formatBytes(splitPreview.summary.blobBytes)} Blob Bytes</span>
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={copySplitReport}>Split Report kopieren</button>
          <button className="primary-button" onClick={writeSplitPreview}>Split-Daten schreiben</button>
        </div>
      </section>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">IndexedDB Driver v0.1</p>
            <h3>Blob Store für lokale Bilder</h3>
          </div>
          <span className={`status-badge ${indexedDbAvailable ? 'status-active' : 'status-rejected'}`}>{indexedDbAvailable ? 'available' : 'unavailable'}</span>
        </div>
        <p className="body-copy">
          Dieser Driver speichert lokale Bild-Blob-Records im Browser IndexedDB Object Store. Die alte Review-Liste bleibt noch als Fallback bestehen, bis Lesen/Schreiben vollständig auf die neue Schicht umgestellt ist.
        </p>
        <div className="chips">
          <span>{indexedDbBlobCount} records</span>
          <span>{formatBytes(indexedDbBytes)} payload</span>
          <span>{splitPreview.imageBlobs.length} ready to migrate</span>
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={migrateSplitBlobsToIndexedDb}>Blobs nach IndexedDB schreiben</button>
          <button className="ghost-button" onClick={clearIndexedDbBlobs}>IndexedDB Blob Store leeren</button>
        </div>
      </section>

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
