import { useEffect, useMemo, useState } from 'react';
import {
  buildApprovedDatasetCaptionFiles,
  buildApprovedDatasetItems,
  buildApprovedDatasetManifestJson,
  buildApprovedDatasetReport,
  summarizeApprovedDataset
} from '../domain/assets/riccoApprovedDatasetExport';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
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

export function RiccoApprovedDatasetExport() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('Approved Dataset Export neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const items = useMemo(() => buildApprovedDatasetItems(images, generationJobs), [images, generationJobs]);
  const summary = useMemo(() => summarizeApprovedDataset(items), [items]);
  const manifestJson = useMemo(() => buildApprovedDatasetManifestJson(items), [items]);
  const captionFiles = useMemo(() => buildApprovedDatasetCaptionFiles(items), [items]);
  const captionFilesJson = useMemo(() => JSON.stringify(captionFiles, null, 2), [captionFiles]);

  async function copyManifest() {
    await navigator.clipboard.writeText(manifestJson);
    setStatus('Approved Dataset Manifest kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyCaptionFiles() {
    await navigator.clipboard.writeText(captionFilesJson);
    setStatus('Caption File Liste kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildApprovedDatasetReport(items));
    setStatus('Approved Dataset Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  function downloadManifest() {
    const blob = new Blob([manifestJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ricco-approved-dataset-manifest-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="page-stack">
      <div className={summary.warnings > 0 ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Approved Dataset Export v0.1</p>
        <h2>{summary.total > 0 ? `${summary.total} Approved Dataset Assets` : 'Keine approved_dataset Assets'}</h2>
        <p className="body-copy">
          Exportiert nur fertig geprüfte Assets mit Status <strong>approved_dataset</strong>. Das ist der finale Manifest-Schritt vor späterem LoRA-Training.
        </p>
        <div className="chips">
          <span>{summary.total} approved_dataset</span>
          <span>{summary.ready} ready</span>
          <span>{summary.warnings} warnings</span>
          <span>{summary.missingTarget} missing target</span>
          <span>{summary.missingTrigger} missing trigger</span>
          <span>{summary.missingCaption} missing caption</span>
          <span>{summary.characterLora} character LoRA</span>
          <span>{summary.locationLora} location LoRA</span>
          <span>{summary.styleLora} style LoRA</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyManifest}>Manifest kopieren</button>
          <button className="ghost-button" onClick={downloadManifest}>Manifest herunterladen</button>
          <button className="ghost-button" onClick={copyCaptionFiles}>Caption Files kopieren</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <a className="ghost-link" href="#/ricco-dataset-candidates">Dataset Candidates</a>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
        </div>
      </div>

      {items.length === 0 && (
        <div className="card">
          <p className="eyebrow">Leer</p>
          <h3>Keine approved_dataset Assets</h3>
          <p className="body-copy">Setze fertige Dataset Candidates zuerst auf approved_dataset.</p>
        </div>
      )}

      <div className="grid two-col">
        {items.map((item) => (
          <article className="card export-card" key={item.image.id} style={item.ready ? { borderColor: 'rgba(120,255,170,0.36)' } : undefined}>
            <div className="mock-preview image-preview" style={{ backgroundImage: `url(${item.image.imageUrl})` }}>
              <span>Panel {item.panelNumber}</span>
              <strong>{item.ready ? 'READY' : 'WARN'}</strong>
            </div>

            <div className="card-header">
              <div>
                <p className="eyebrow">{item.image.id}</p>
                <h3>{item.targetLabel}</h3>
              </div>
              <span className={`status-badge ${item.ready ? 'status-active' : 'status-needs_fix'}`}>{item.ready ? 'ready' : 'warning'}</span>
            </div>

            <div className="chips">
              <span>{item.targetType || 'missing target'}</span>
              <span>{item.triggerWord || 'no trigger'}</span>
              <span>Rating {item.image.rating || '—'}</span>
              <span>Continuity {item.image.continuityScore || '—'}</span>
              <span>{item.generationJob ? 'job linked' : 'no job'}</span>
            </div>

            {item.warnings.length > 0 && (
              <div className="dialogue-box">
                <p className="eyebrow">Warnings</p>
                <ul>
                  {item.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}

            <div className="dialogue-box">
              <p className="eyebrow">Caption</p>
              <p>{item.caption || 'missing caption'}</p>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Caption File</p>
              <p>{item.image.imageUrl.replace(/\.[a-z0-9]+$/i, '')}.txt</p>
            </div>

            {item.generationJob && (
              <div className="dialogue-box">
                <p className="eyebrow">Generation Job</p>
                <p>{item.generationJob.id}</p>
                <p>Status: {item.generationJob.status}</p>
                <p>Workflow: {item.generationJob.workflowId} {item.generationJob.workflowVersion}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Final Training Manifest</p>
            <h3>ricco-approved-dataset-manifest-v1</h3>
          </div>
          <button className="ghost-button" onClick={copyManifest}>Copy</button>
        </div>
        <textarea readOnly value={manifestJson} style={{ minHeight: 360 }} />
      </section>
    </section>
  );
}
