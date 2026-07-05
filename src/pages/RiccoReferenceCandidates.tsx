import { useEffect, useMemo, useState } from 'react';
import {
  buildReferenceCandidateBrief,
  buildReferenceCandidateItems,
  buildReferenceCandidateReport,
  buildReferenceCandidateTargets,
  REFERENCE_CANDIDATE_RESOLUTION_STATUSES,
  resolveReferenceCandidate,
  summarizeReferenceCandidates,
  updateReferenceCandidateTarget
} from '../domain/assets/riccoReferenceCandidates';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { AssetStatus, GenerationJob } from '../types/productionBackend';
import type { ReferenceCandidateType, RiccoPanelImage } from '../types/riccoReview';

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

function isReferenceCandidateType(value: string): value is ReferenceCandidateType {
  return value === 'character' || value === 'location' || value === 'style';
}

export function RiccoReferenceCandidates() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('Reference Candidates neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const targets = useMemo(() => buildReferenceCandidateTargets(), []);
  const candidates = useMemo(() => buildReferenceCandidateItems(images, generationJobs), [images, generationJobs]);
  const summary = useMemo(() => summarizeReferenceCandidates(candidates), [candidates]);

  function updateTarget(imageId: string, type: ReferenceCandidateType, subjectId: string) {
    const nextImages = updateReferenceCandidateTarget(images, imageId, { type, subjectId });
    setImages(nextImages);
    writeStoredImages(nextImages);
    setStatus(`${imageId} target gesetzt`);
    window.setTimeout(() => setStatus(''), 1500);
  }

  function updateNotes(imageId: string, notes: string) {
    const nextImages = updateReferenceCandidateTarget(images, imageId, { notes });
    setImages(nextImages);
    writeStoredImages(nextImages);
    setStatus(`${imageId} notes gespeichert`);
    window.setTimeout(() => setStatus(''), 1500);
  }

  function resolveItem(imageId: string, nextStatus: AssetStatus) {
    const nextImages = resolveReferenceCandidate(images, imageId, nextStatus);
    setImages(nextImages);
    writeStoredImages(nextImages);
    setStatus(`${imageId} → ${nextStatus}`);
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildReferenceCandidateReport(candidates));
    setStatus('Reference Candidate Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyBrief(imageId: string) {
    const item = candidates.find((candidate) => candidate.image.id === imageId);
    if (!item) return;
    await navigator.clipboard.writeText(buildReferenceCandidateBrief(item));
    setStatus('Candidate Brief kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={summary.total > 0 ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco Reference Candidates v0.1</p>
        <h2>{summary.total > 0 ? `${summary.total} Reference Candidates` : 'Keine Reference Candidates'}</h2>
        <p className="body-copy">
          Sammelt alle Assets mit Status <strong>reference_candidate</strong>. Weise sie Character, Location oder Style zu und kopiere daraus einen Reference-Brief.
        </p>
        <div className="chips">
          <span>{summary.total} candidates</span>
          <span>{summary.withTarget} with target</span>
          <span>{summary.missingTarget} missing target</span>
          <span>{summary.characterCandidates} character</span>
          <span>{summary.locationCandidates} location</span>
          <span>{summary.styleCandidates} style</span>
          <span>{summary.linkedToJobs} job-linked</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review</a>
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="card">
          <p className="eyebrow">Leer</p>
          <h3>Keine reference_candidate Assets</h3>
          <p className="body-copy">Markiere gute Character-, Location- oder Style-Bilder in der Asset Library als reference_candidate.</p>
        </div>
      )}

      <div className="grid two-col">
        {candidates.map((item) => (
          <article className="card export-card" key={item.image.id}>
            <div className="mock-preview image-preview" style={{ backgroundImage: `url(${item.image.imageUrl})` }}>
              <span>Panel {item.panelNumber}</span>
              <strong>REFERENCE</strong>
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
              <label>Reference Target</label>
              <select
                value={item.targetType && item.targetSubjectId ? `${item.targetType}:${item.targetSubjectId}` : ''}
                onChange={(event) => {
                  const [rawType, subjectId = ''] = event.target.value.split(':');
                  if (isReferenceCandidateType(rawType) && subjectId) updateTarget(item.image.id, rawType, subjectId);
                }}
              >
                <option value="">Target wählen...</option>
                {targets.map((target) => <option key={`${target.type}:${target.subjectId}`} value={`${target.type}:${target.subjectId}`}>{target.type}: {target.label}</option>)}
              </select>
            </div>

            <div>
              <label>Candidate Notes</label>
              <textarea value={item.candidateNotes} onChange={(event) => updateNotes(item.image.id, event.target.value)} />
            </div>

            {item.generationJob && (
              <div className="dialogue-box">
                <p className="eyebrow">Generation Job</p>
                <p>{item.generationJob.id}</p>
                <p>Status: {item.generationJob.status}</p>
                <p>Workflow: {item.generationJob.workflowId} {item.generationJob.workflowVersion}</p>
              </div>
            )}

            <div>
              <label>Resolve</label>
              <select value={item.assetStatus} onChange={(event) => resolveItem(item.image.id, event.target.value as AssetStatus)}>
                <option value="reference_candidate">reference_candidate</option>
                {REFERENCE_CANDIDATE_RESOLUTION_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="review-actions">
              <button className="ghost-button" onClick={() => copyBrief(item.image.id)}>Brief kopieren</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'approved_reference')}>Approve Reference</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'dataset_candidate')}>Dataset Candidate</button>
              <button className="ghost-button" onClick={() => resolveItem(item.image.id, 'rejected')}>Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
