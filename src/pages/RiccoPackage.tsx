import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildRiccoPackageFileName,
  buildRiccoProductionPackage
} from '../domain/package/riccoProductionPackage';
import {
  normalizeRiccoLetteringLayoutState,
  RICCO_LETTERING_STORAGE_KEY,
  type RiccoLetteringLayoutState
} from '../domain/lettering/riccoLetteringLayout';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs,
  readReferenceReviewStorage
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
import type { ReferenceReviewState } from '../types/riccoReferenceReview';
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

function readLetteringLayout(): RiccoLetteringLayoutState {
  try {
    const raw = window.localStorage.getItem(RICCO_LETTERING_STORAGE_KEY);
    return normalizeRiccoLetteringLayoutState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeRiccoLetteringLayoutState({});
  }
}

export function RiccoPackage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [referenceReviewState, setReferenceReviewState] = useState<ReferenceReviewState>({});
  const [letteringLayoutState, setLetteringLayoutState] = useState<RiccoLetteringLayoutState>(() => normalizeRiccoLetteringLayoutState({}));
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    refreshPackageState();
  }, []);

  const packageData = useMemo(() => {
    return buildRiccoProductionPackage({ images, generationJobs, referenceReviewState, letteringLayoutState });
  }, [images, generationJobs, referenceReviewState, letteringLayoutState]);

  const packageJson = useMemo(() => JSON.stringify(packageData, null, 2), [packageData]);
  const datasetManifestJson = useMemo(() => JSON.stringify(packageData.datasetState.manifest, null, 2), [packageData.datasetState.manifest]);
  const loraPlanJson = useMemo(() => JSON.stringify(packageData.loraPlanState.snapshot, null, 2), [packageData.loraPlanState.snapshot]);
  const finalCount = packageData.reviewState.finalImageCount;
  const isReady = packageData.reviewState.exportReady;
  const referenceSummary = packageData.referenceState.referenceReviewSummary;
  const letteringState = packageData.letteringState;
  const pipelineState = packageData.pipelineState;
  const assetWorkflow = packageData.assetWorkflowState;
  const datasetState = packageData.datasetState;
  const loraPlanState = packageData.loraPlanState;

  async function copyPackage() {
    await navigator.clipboard.writeText(packageJson);
    setCopyStatus('Package JSON kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyDatasetManifest() {
    await navigator.clipboard.writeText(datasetManifestJson);
    setCopyStatus('Dataset Manifest kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyLoraPlan() {
    await navigator.clipboard.writeText(loraPlanJson);
    setCopyStatus('LoRA Plan Snapshot kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function downloadPackage() {
    const blob = new Blob([packageJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildRiccoPackageFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function refreshPackageState() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setReferenceReviewState(readReferenceReviewStorage());
    setLetteringLayoutState(readLetteringLayout());
    setCopyStatus('Package State neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={isReady ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Production Package v0.6</p>
        <h2>{isReady ? 'Package vollständig' : 'Package mit fehlenden Finalbildern'}</h2>
        <p className="body-copy">
          Exportiert den Produktionsstand als JSON: Storydaten, Panels, Prompts, Generation Jobs, Reference Review, Bildvarianten, Asset-Status, Candidate-Metadaten, Dataset-Manifest, LoRA-Plan-Snapshot, Finalbilder, Lettering-Layouts und Pipeline-Snapshot.
        </p>
        <div className="chips">
          <span>{finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{packageData.generationState.totalJobs} Generation Jobs</span>
          <span>{packageData.generationState.importedJobCount} importiert</span>
          <span>{referenceSummary.approved} approved refs</span>
          <span>{assetWorkflow.assetSummary.total} assets</span>
          <span>{assetWorkflow.fixQueueSummary.total} needs_fix</span>
          <span>{assetWorkflow.referenceCandidateSummary.total} ref candidates</span>
          <span>{assetWorkflow.datasetCandidateSummary.total} dataset candidates</span>
          <span>{datasetState.totalItems} manifest items</span>
          <span>{loraPlanState.readyTargets} LoRA ready</span>
          <span>{loraPlanState.needsWorkTargets} LoRA needs work</span>
          <span>{loraPlanState.totalApprovedItems} approved train items</span>
          <span>{letteringState.editedPanelCount} edited bubbles</span>
          <span>{pipelineState.progress}% pipeline</span>
          <span>current: {pipelineState.currentStageLabel}</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={copyPackage}>JSON kopieren</button>
          <button className="primary-button" onClick={downloadPackage}>JSON herunterladen</button>
          <button className="ghost-button" onClick={copyDatasetManifest}>Dataset Manifest kopieren</button>
          <button className="ghost-button" onClick={copyLoraPlan}>LoRA Plan kopieren</button>
          <button className="ghost-button" onClick={refreshPackageState}>Neu laden</button>
          <a className="ghost-link" href="#/ricco-workspace">Workspace Map</a>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
          <a className="ghost-link" href="#/ricco-dataset-candidates">Dataset Candidates</a>
          <a className="ghost-link" href="#/ricco-lora-training-plan">LoRA Training Plan</a>
          <a className="ghost-link" href="#/ricco-lettering">Lettering</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Inhalt</p>
          <h3>Was im Package steckt</h3>
          <ul>
            <li>Series-Daten und Master Prompts</li>
            <li>Character- und Location-Daten</li>
            <li>Alle Panels mit Action, Kamera, Mood und Dialog</li>
            <li>Positive und Negative Prompts pro Panel</li>
            <li>Generation Jobs inklusive Seed, Status, Settings und Output-Pfad</li>
            <li>Reference Review mit Status, Pfaden und Notizen</li>
            <li>Gespeicherte Bildvarianten aus LocalStorage</li>
            <li>Asset-Status Workflow inklusive Fix/Reference/Dataset Counts</li>
            <li>Reference-Candidate- und Dataset-Candidate-Metadaten in den Bildern</li>
            <li>Dataset Manifest mit Trigger, Caption und LoRA-Ziel</li>
            <li>LoRA Training Plan Snapshot mit Target-Readiness und Caption-Dateien</li>
            <li>Finalbild pro Panel inklusive Rating, Continuity und Notizen</li>
            <li>Lettering-Layouts inklusive Bubble-Text, Position, Breite und Font</li>
            <li>Pipeline-Snapshot mit Current Stage und Fortschritt</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Status</p>
          <h3>{isReady ? 'Bereit zur Sicherung' : 'Noch nicht komplett'}</h3>
          <ul>
            {packageData.nextSteps.map((step) => <li key={step}>{step}</li>)}
          </ul>
          <div className="chips">
            <span>{assetWorkflow.statusMetadataImageCount} status metadata</span>
            <span>{assetWorkflow.referenceMetadataImageCount} reference metadata</span>
            <span>{assetWorkflow.datasetMetadataImageCount} dataset metadata</span>
            <span>{loraPlanState.readyTargets} ready targets</span>
            <span>{loraPlanState.needsWorkTargets} targets need work</span>
          </div>
        </section>
      </div>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">LoRA Plan Snapshot</p>
            <h3>{loraPlanState.readyTargets} ready · {loraPlanState.needsWorkTargets} need work</h3>
          </div>
          <button className="ghost-button" onClick={copyLoraPlan}>Copy LoRA Plan</button>
        </div>
        <textarea readOnly value={loraPlanJson} style={{ minHeight: 320 }} />
      </section>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Dataset Manifest</p>
            <h3>{datasetState.manifestVersion}</h3>
          </div>
          <button className="ghost-button" onClick={copyDatasetManifest}>Copy Manifest</button>
        </div>
        <textarea readOnly value={datasetManifestJson} style={{ minHeight: 320 }} />
      </section>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Raw JSON</p>
            <h3>Production Package</h3>
          </div>
          <button className="ghost-button" onClick={copyPackage}>Copy</button>
        </div>
        <textarea readOnly value={packageJson} style={{ minHeight: 520 }} />
      </section>
    </section>
  );
}
