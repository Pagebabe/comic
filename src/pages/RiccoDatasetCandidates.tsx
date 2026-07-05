import { useEffect, useMemo, useState } from 'react';
import {
  buildDatasetCandidateItems,
  buildDatasetCandidateReport,
  buildDatasetCandidateTargets,
  buildDatasetManifestJson,
  DATASET_CANDIDATE_RESOLUTION_STATUSES,
  resolveDatasetCandidate,
  summarizeDatasetCandidates,
  updateDatasetCandidateMetadata
} from '../domain/assets/riccoDatasetCandidates';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { AssetStatus, GenerationJob } from '../types/productionBackend';
import type { DatasetCandidateTargetType, RiccoPanelImage } from '../types/riccoReview';

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

function isDatasetTargetType(value: string): value is DatasetCandidateTargetType {
  return value === 'character_lora' || value === 'location_lora' || value === 'style_lora';
}

export function RiccoDatasetCandidates() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('Dataset Candidates neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const targets = useMemo(() => buildDatasetCandidateTargets(), []);
  const candidates = useMemo(() => buildDatasetCandidateItems(images, generationJobs), [images, generationJobs]);
  const summary = useMemo(() => summarizeDatasetCandidates(candidates), [candidates]);

  function saveImages(nextImages: RiccoPanelImage[], message: string) {
    setImages(nextImages);
    try {
      writeStoredImages(nextImages);
      setStatus(message);
    } catch {
      setStatus('Dataset-Metadaten konnten nicht gespeichert werden. Browser-Speicher prüfen.');
    }
    window.setTimeout(() => setStatus(''), 1500);
  }

  function updateTarget(imageId: string, targetValue: string) {
    const [rawType, targetId = ''] = targetValue.split(':');
    if (!isDatasetTargetType(rawType) || !targetId) return;
    const target = targets.find((item) => item.type === rawType && item.targetId === targetId);
    const nextImages = updateDatasetCandidateMetadata(images, imageId, {
      targetType: rawType,
      targetId,
      triggerWord: target?.triggerWord
    });
    saveImages(nextImages, `${imageId} dataset target gesetzt`);
  }

  function updateField(imageId: string, patch: Parameters<typeof updateDatasetCandidateMetadata>[2]) {
    const nextImages = updateDatasetCandidateMetadata(images, imageId, patch);
    saveImages(nextImages, `${imageId} Dataset-Metadaten gespeichert`);
  }

  function resolveItem(imageId: string, nextStatus: AssetStatus) {
    const nextImages = resolveDatasetCandidate(images, imageId, nextStatus);
    saveImages(nextImages, `${imageId} → ${nextStatus}`);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildDatasetCandidateReport(candidates));
    setStatus('Dataset Candidate Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyManifest() {
    await navigator.clipboard.writeText(buildDatasetManifestJson(candidates));
    setStatus('Dataset Manifest JSON kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  function downloadManifest() {
    const blob = new Blob([buildDatasetManifestJson(candidates)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ricco-dataset-manifest-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="page-stack">
      <div className={summary.total > 0 ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Dataset Candidates v0.1</p>
        <h2>{summary.total > 0 ? `${summary.total} Dataset Candidates` : 'Keine Dataset Candidates'}</h2>
        <p className="body-copy">
          Sammelt alle Assets mit Status <strong>dataset_candidate</strong>. Bereite LoRA-Ziel, Trigger-Wort, Caption und Manifest vor. Noch kein Training, nur Dataset-Curation.
        </p>
        <div className="chips">
          <span>{summary.total} candidates</span>
          <span>{summary.withTarget} with target</span>
          <span>{summary.missingTarget} missing target</span>
          <span>{summary.characterLora} character LoRA</span>
          <span>{summary.locationLora} location LoRA</span>
          <span>{summary.styleLora} style LoRA</span>
          <span>{summary.captioned} captioned</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyManifest}>Manifest kopieren</button>
          <button className="ghost-button" onClick={downloadManifest}>Manifest herunterladen</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
          <a className="ghost-link" href="#/ricco-reference-candidates">Reference Candidates</a>
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs</a>
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="card">
          <p className="eyebrow">Leer</p>
          <h3>Keine dataset_candidate Assets</h3>
          <p className="body-copy">Markiere gute, konsistente Bilder in der Asset Library oder im Reference Candidate Flow als dataset_candidate.</p>
        </div>
      )}

      <div className="grid two-col">
        {candidates.map((item) => (
          <article className="card export-card" key={item.image.id}>
            <div className="mock-preview image-preview" style={{ backgroundImage: `url(${item.image.imageUrl})` }}>
              <span>Panel {item.panelNumber}</span>
              <strong>DATASET</strong>
            </div>

            <div className="card-header">
              <div>
                <p className="eyebrow">{item.image.id}</p>
                <h3>{item.panelTitle}</h3>
              </div>
              <span className="status-badge status-needs_fix">{item.targetLabel}</span>
            </div>

            <div className="chips">
              <span>{item.image.source}</span>
              <span>{item.isFinal ? 'final image' : 'variant'}</span>
              <span>{item.generationJob ? 'job linked' : 'no job'}</span>
              <span>Rating {item.image.rating || '—'}</span>
              <span>Continuity {item.image.continuityScore || '—'}</span>
            </div>

            <div>
              <label>Dataset / LoRA Target</label>
              <select
                value={item.targetType && item.targetId ? `${item.targetType}:${item.targetId}` : ''}
                onChange={(event) => updateTarget(item.image.id, event.target.value)}
              >
                <option value="">Target wählen...</option>
                {targets.map((target) => <option key={`${target.type}:${target.targetId}`} value={`${target.type}:${target.targetId}`}>{target.type}: {target.label}</option>)}
              </select>
            </div>

            <div className="grid two-col">
              <div>
                <label>Trigger Word</label>
                <input value={item.triggerWord} onChange={(event) => updateField(item.image.id, { triggerWord: event.target.value })} placeholder="ricco_rih" />
              </div>
              <div>
                <label>Resolve</label>
                <select value={item.assetStatus} onChange={(event) => resolveItem(item.image.id, event.target.value as AssetStatus)}>
                  <option value="dataset_candidate">dataset_candidate</option>
                  {DATASET_CANDIDATE_RESOLUTION_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label>Caption</label>
              <textarea value={item.caption} onChange={(event) => updateField(item.image.id, { caption: event.target.value })} />
            </div>

            <div>
              <label>Dataset Notes</label>
              <textarea value={item.datasetNotes} onChange={(event) => updateField(item.image.id, { notes: event.target.value })} />
            </div>

            {item.generationJob && (
              <div className="dialogue-box">
                <p className="eyebrow">Generation Job</p>
                <p>{item.generationJob.id}</p>
                <p>Status: {item.generationJob.status}</p>
                <p>Workflow: {item.generationJob.workflowId} {item.generationJob.workflowVersion}</p>
                <p>Seed: {item.generationJob.seed ?? '—'}</p>
              </div>
            )}

            <div className="review-actions">
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'approved_dataset')}>Approve Dataset</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'approved_reference')}>Approved Reference</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'needs_fix')}>Needs Fix</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'rejected')}>Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
