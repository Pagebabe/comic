import { useEffect, useMemo, useState } from 'react';
import {
  buildFixQueueItems,
  buildFixQueueReport,
  FIX_QUEUE_RESOLUTION_STATUSES,
  resolveFixQueueItem,
  statusClassForAsset,
  summarizeFixQueue
} from '../domain/assets/riccoFixQueue';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { AssetStatus, GenerationJob } from '../types/productionBackend';
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

function writeStoredImages(images: RiccoPanelImage[]) {
  window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify(images));
}

export function RiccoFixQueue() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('Fix Queue neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const fixItems = useMemo(() => buildFixQueueItems(images, generationJobs), [images, generationJobs]);
  const summary = useMemo(() => summarizeFixQueue(fixItems), [fixItems]);

  function resolveItem(imageId: string, nextStatus: AssetStatus) {
    const nextImages = resolveFixQueueItem(images, imageId, nextStatus);
    setImages(nextImages);
    try {
      writeStoredImages(nextImages);
      setStatus(`${imageId} → ${nextStatus}`);
    } catch {
      setStatus('Status konnte nicht gespeichert werden. Browser-Speicher prüfen.');
    }
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildFixQueueReport(fixItems));
    setStatus('Fix Queue Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={summary.total > 0 ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Fix Queue v0.1</p>
        <h2>{summary.total > 0 ? `${summary.total} Assets brauchen Fix` : 'Keine Fixes offen'}</h2>
        <p className="body-copy">
          Sammelt alle Assets mit Status <strong>needs_fix</strong>. Von hier aus siehst du Panel, Bild, Review-Notes, Job-Link und kannst den Fix-Status abschließen.
        </p>
        <div className="chips">
          <span>{summary.total} needs_fix</span>
          <span>{summary.panelsAffected} Panels betroffen</span>
          <span>{summary.linkedToJobs} mit Job-Link</span>
          <span>{summary.unlinked} ohne Job-Link</span>
          <span>{summary.localImages} lokale Bilder</span>
          <span>{summary.urlImages} URL/Public</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review</a>
        </div>
      </div>

      {fixItems.length === 0 && (
        <div className="card">
          <p className="eyebrow">Clean</p>
          <h3>Keine `needs_fix` Assets</h3>
          <p className="body-copy">Markiere Assets in der Asset Library als `needs_fix`, wenn sie neu generiert oder repariert werden müssen.</p>
        </div>
      )}

      <div className="grid two-col">
        {fixItems.map((item) => (
          <article className="card export-card" key={item.image.id}>
            <div className="mock-preview image-preview" style={{ backgroundImage: `url(${item.image.imageUrl})` }}>
              <span>Panel {item.panelNumber}</span>
              <strong>NEEDS FIX</strong>
            </div>

            <div className="card-header">
              <div>
                <p className="eyebrow">{item.image.id}</p>
                <h3>{item.panelTitle}</h3>
              </div>
              <span className={`status-badge ${statusClassForAsset(item.assetStatus)}`}>{item.assetStatus}</span>
            </div>

            <div className="chips">
              <span>{item.isFinal ? 'final image' : 'variant'}</span>
              <span>{item.image.source}</span>
              <span>{item.isLocal ? 'local data-url' : 'url/public'}</span>
              <span>Rating {item.image.rating || '—'}</span>
              <span>Continuity {item.image.continuityScore || '—'}</span>
              <span>{item.generationJob ? 'job linked' : 'no job'}</span>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Fix Reason</p>
              <p>{item.fixReason}</p>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Suggested Action</p>
              <p>{item.suggestedAction}</p>
            </div>

            {item.generationJob && (
              <div className="dialogue-box">
                <p className="eyebrow">Linked Generation Job</p>
                <p>{item.generationJob.id}</p>
                <p>Status: {item.generationJob.status}</p>
                <p>Workflow: {item.generationJob.workflowId} {item.generationJob.workflowVersion}</p>
                <p>Seed: {item.generationJob.seed ?? '—'}</p>
              </div>
            )}

            {item.image.promptUsed && (
              <details className="dialogue-box">
                <summary>Prompt anzeigen</summary>
                <p>{item.image.promptUsed}</p>
              </details>
            )}

            <div>
              <label>Resolve Status</label>
              <select value={item.assetStatus} onChange={(event) => resolveItem(item.image.id, event.target.value as AssetStatus)}>
                <option value="needs_fix">needs_fix</option>
                {FIX_QUEUE_RESOLUTION_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="review-actions">
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'fixed')}>Als fixed markieren</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'approved_panel')}>Als approved_panel</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'rejected')}>Reject</button>
              <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue</a>
              <a className="ghost-link" href="#/ricco-image-review">Review</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
