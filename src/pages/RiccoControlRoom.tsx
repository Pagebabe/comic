import { useEffect, useMemo, useState } from 'react';
import { riccoCharacters, riccoEpisode, riccoPanels, riccoSeries } from '../data/riccoStudio';
import { buildApprovedDatasetItems, summarizeApprovedDataset } from '../domain/assets/riccoApprovedDatasetExport';
import { buildAssetLibraryItems, summarizeAssetLibrary } from '../domain/assets/riccoAssetLibrary';
import { buildDatasetCandidateItems, summarizeDatasetCandidates } from '../domain/assets/riccoDatasetCandidates';
import { buildFixQueueItems, summarizeFixQueue } from '../domain/assets/riccoFixQueue';
import { buildReferenceCandidateItems, summarizeReferenceCandidates } from '../domain/assets/riccoReferenceCandidates';
import {
  estimateStorageBytes,
  readLocalGenerationJobs,
  readReferenceReviewStorage,
  RICCO_IMAGES_STORAGE_KEY
} from '../lib/backend/localProductionStore';
import {
  normalizeRiccoLetteringLayoutState,
  RICCO_LETTERING_STORAGE_KEY,
  type RiccoLetteringLayoutState
} from '../domain/lettering/riccoLetteringLayout';
import { buildLoraTrainingPlan } from '../domain/training/riccoLoraTrainingPlan';
import {
  buildRiccoPipelineMap,
  pipelineStatusClass,
  pipelineStatusLabel
} from '../domain/workspace/riccoPipelineMap';
import { summarizeReferenceReviewState, type ReferenceReviewState } from '../types/riccoReferenceReview';
import type { GenerationJob } from '../types/productionBackend';
import type { RiccoPanelImage } from '../types/riccoReview';

type StepStatus = 'done' | 'active' | 'blocked';

type ProductionStep = {
  title: string;
  route: string;
  status: StepStatus;
  note: string;
};

const MIN_RATING = 4;
const MIN_CONTINUITY = 4;
const STORAGE_WARNING_BYTES = 3_500_000;
const MIN_APPROVED_REFERENCES_FOR_PILOT = 4;

function readRawStorage() {
  try {
    return window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY) ?? '';
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

function readLetteringLayout(): RiccoLetteringLayoutState {
  try {
    const raw = window.localStorage.getItem(RICCO_LETTERING_STORAGE_KEY);
    return normalizeRiccoLetteringLayoutState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeRiccoLetteringLayoutState({});
  }
}

function referenceStepStatus(approved: number, total: number): StepStatus {
  if (approved >= MIN_APPROVED_REFERENCES_FOR_PILOT) return 'done';
  if (total > 0) return 'active';
  return 'blocked';
}

function statusClass(status: StepStatus) {
  if (status === 'done') return 'status-active';
  if (status === 'blocked') return 'status-rejected';
  return 'status-needs_fix';
}

function statusLabel(status: StepStatus) {
  if (status === 'done') return 'done';
  if (status === 'blocked') return 'blocked';
  return 'active';
}

export function RiccoControlRoom() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [referenceReviewState, setReferenceReviewState] = useState<ReferenceReviewState>({});
  const [letteringLayoutState, setLetteringLayoutState] = useState<RiccoLetteringLayoutState>(() => normalizeRiccoLetteringLayoutState({}));
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setReferenceReviewState(readReferenceReviewStorage());
    setLetteringLayoutState(readLetteringLayout());
    setStorageBytes(estimateStorageBytes());
  }, []);

  const generationJobCount = generationJobs.length;

  const pipeline = useMemo(() => buildRiccoPipelineMap({
    referenceReviewState,
    generationJobs,
    images,
    letteringLayoutState
  }), [referenceReviewState, generationJobs, images, letteringLayoutState]);

  const report = useMemo(() => {
    const finalImages = images.filter((image) => image.selected);
    const finalImagesByPanelId = new Map(finalImages.map((image) => [image.panelId, image]));
    const finalPanelCount = riccoPanels.filter((panel) => finalImagesByPanelId.has(panel.id)).length;
    const missingFinals = riccoPanels.length - finalPanelCount;
    const lowRating = finalImages.filter((image) => (image.rating || 0) < MIN_RATING).length;
    const lowContinuity = finalImages.filter((image) => (image.continuityScore || 0) < MIN_CONTINUITY).length;
    const missingNotes = finalImages.filter((image) => !image.notes.trim()).length;
    const gateIssues = missingFinals + lowRating + lowContinuity + missingNotes;
    const progress = Math.round((finalPanelCount / riccoPanels.length) * 100);
    const storageWarning = storageBytes > STORAGE_WARNING_BYTES;
    const references = summarizeReferenceReviewState(referenceReviewState);
    const referencesStatus = referenceStepStatus(references.approved, references.total);
    const assetItems = buildAssetLibraryItems(images, generationJobs);
    const assetSummary = summarizeAssetLibrary(assetItems);
    const fixQueueSummary = summarizeFixQueue(buildFixQueueItems(images, generationJobs));
    const referenceCandidateSummary = summarizeReferenceCandidates(buildReferenceCandidateItems(images, generationJobs));
    const datasetCandidateSummary = summarizeDatasetCandidates(buildDatasetCandidateItems(images, generationJobs));
    const approvedDatasetSummary = summarizeApprovedDataset(buildApprovedDatasetItems(images, generationJobs));
    const loraPlan = buildLoraTrainingPlan(images, generationJobs);
    const assetWorkflowIssues = fixQueueSummary.total + referenceCandidateSummary.missingTarget + datasetCandidateSummary.missingTarget + approvedDatasetSummary.warnings + loraPlan.needsWorkTargets;

    const steps: ProductionStep[] = [
      {
        title: 'Workspace Map',
        route: '#/ricco-workspace',
        status: pipeline.blockedCount === 0 ? 'done' : 'active',
        note: `${pipeline.progress}% Pipeline-Fortschritt. Aktuelle Stage: ${pipeline.currentStage.label}.`
      },
      {
        title: 'Prompt Workbench',
        route: '#/ricco-studio',
        status: 'done',
        note: `${riccoPanels.length} Panels sind im Seed vorbereitet.`
      },
      {
        title: 'Prompt Queue',
        route: '#/ricco-prompt-queue',
        status: 'active',
        note: 'Alle Panel-Prompts als JSON, TXT oder CSV für externe Bildgenerierung exportieren.'
      },
      {
        title: 'Generation Queue',
        route: '#/ricco-generation-queue',
        status: generationJobCount > 0 ? 'done' : 'active',
        note: generationJobCount > 0
          ? `${generationJobCount} Render-Jobs sind für manuelle/API-fähige ComfyUI-Produktion vorbereitet.`
          : 'Prompt Queue in nachvollziehbare Render-Jobs mit Seed, Settings und Output-Pfad übersetzen.'
      },
      {
        title: 'ComfyUI M1 Renderplan',
        route: '#/ricco-comfy-m1',
        status: 'active',
        note: 'Lokale SDXL Settings, Dateinamen und Render-Checkliste prüfen.'
      },
      {
        title: 'Reference Packs',
        route: '#/ricco-reference-packs',
        status: referencesStatus,
        note: references.approved >= MIN_APPROVED_REFERENCES_FOR_PILOT
          ? `${references.approved} approved references. Genug Basis für erste Pilot-Tests.`
          : `${references.approved}/${MIN_APPROVED_REFERENCES_FOR_PILOT} approved references. Candidates: ${references.candidate}, Redraw: ${references.needsRedraw}, Rejected: ${references.rejected}.`
      },
      {
        title: 'Asset Import',
        route: '#/ricco-asset-import',
        status: 'active',
        note: 'Empfohlen: Bilder in public/generated/ legen und nur Pfade importieren, statt Base64 zu speichern.'
      },
      {
        title: 'Asset Library',
        route: '#/ricco-assets',
        status: assetSummary.total > 0 ? 'done' : 'active',
        note: `${assetSummary.total} Assets, ${assetSummary.statusCounts.approved_panel} approved_panel, ${assetSummary.statusCounts.needs_fix} needs_fix, ${assetSummary.statusCounts.dataset_candidate} dataset_candidate, ${assetSummary.statusCounts.approved_dataset} approved_dataset.`
      },
      {
        title: 'Fix Queue',
        route: '#/ricco-fix-queue',
        status: fixQueueSummary.total > 0 ? 'active' : assetSummary.total > 0 ? 'done' : 'blocked',
        note: fixQueueSummary.total > 0 ? `${fixQueueSummary.total} Assets brauchen Reparatur.` : 'Keine offenen needs_fix Assets.'
      },
      {
        title: 'Reference Candidates',
        route: '#/ricco-reference-candidates',
        status: referenceCandidateSummary.missingTarget > 0 ? 'active' : referenceCandidateSummary.total > 0 || assetSummary.total > 0 ? 'done' : 'blocked',
        note: `${referenceCandidateSummary.total} Candidates, ${referenceCandidateSummary.withTarget} mit Target, ${referenceCandidateSummary.missingTarget} ohne Target.`
      },
      {
        title: 'Dataset Candidates',
        route: '#/ricco-dataset-candidates',
        status: datasetCandidateSummary.missingTarget > 0 ? 'active' : datasetCandidateSummary.total > 0 || assetSummary.total > 0 ? 'done' : 'blocked',
        note: `${datasetCandidateSummary.total} Dataset Candidates, ${datasetCandidateSummary.withTarget} mit Target, ${datasetCandidateSummary.captioned} captioned.`
      },
      {
        title: 'Approved Dataset Export',
        route: '#/ricco-approved-dataset',
        status: approvedDatasetSummary.warnings > 0 ? 'active' : approvedDatasetSummary.total > 0 ? 'done' : assetSummary.total > 0 ? 'active' : 'blocked',
        note: `${approvedDatasetSummary.ready}/${approvedDatasetSummary.total} approved_dataset ready, ${approvedDatasetSummary.warnings} warnings.`
      },
      {
        title: 'LoRA Training Plan',
        route: '#/ricco-lora-training-plan',
        status: loraPlan.needsWorkTargets > 0 ? 'active' : loraPlan.readyTargets > 0 ? 'done' : approvedDatasetSummary.total > 0 ? 'active' : 'blocked',
        note: `${loraPlan.readyTargets} LoRA targets ready, ${loraPlan.needsWorkTargets} targets need work, ${loraPlan.totalApprovedItems} approved items.`
      },
      {
        title: 'Bulk Upload',
        route: '#/ricco-bulk-upload',
        status: 'active',
        note: 'Alternative: mehrere lokale Bilder als Browser-Uploads speichern und per Dateiname Panels zuordnen.'
      },
      {
        title: 'Image Review',
        route: '#/ricco-image-review',
        status: images.length > 0 ? 'done' : 'active',
        note: `${images.length} Bildvarianten gespeichert.`
      },
      {
        title: 'Storage Manager',
        route: '#/ricco-storage',
        status: storageWarning ? 'active' : 'done',
        note: storageWarning ? 'Browser-Speicher prüfen und nicht-finale Varianten aufräumen.' : 'Browser-Speicher ist im grünen Bereich.'
      },
      {
        title: 'Review Gate',
        route: '#/ricco-qa',
        status: gateIssues === 0 ? 'done' : missingFinals > 0 ? 'blocked' : 'active',
        note: `${gateIssues} offene Punkte: ${missingFinals} fehlende Finals, ${lowRating} Rating, ${lowContinuity} Continuity, ${missingNotes} Notizen.`
      },
      {
        title: 'Export Gate',
        route: '#/ricco-export',
        status: missingFinals === 0 ? 'done' : 'blocked',
        note: `${finalPanelCount}/${riccoPanels.length} Panels haben ein Finalbild.`
      },
      {
        title: 'Lettering Editor',
        route: '#/ricco-lettering',
        status: missingFinals === 0 ? 'active' : 'blocked',
        note: missingFinals === 0 ? 'Bubble-Layout und Dialog-Overlay können gesetzt werden.' : 'Erst alle Finalbilder wählen.'
      },
      {
        title: 'Package Backup',
        route: '#/ricco-package',
        status: images.length > 0 || references.total > 0 ? 'active' : 'blocked',
        note: images.length > 0 || references.total > 0 ? 'Produktionsstand als JSON sichern.' : 'Erst Review-Bilder oder References speichern.'
      },
      {
        title: 'Restore Backup',
        route: '#/ricco-restore',
        status: 'active',
        note: 'Gesichertes JSON kann wieder eingespielt werden.'
      }
    ];

    const nextStep = steps.find((step) => step.status !== 'done') ?? steps[steps.length - 1];

    return {
      finalPanelCount,
      missingFinals,
      lowRating,
      lowContinuity,
      missingNotes,
      gateIssues,
      progress,
      storageWarning,
      references,
      referencesStatus,
      assetSummary,
      fixQueueSummary,
      referenceCandidateSummary,
      datasetCandidateSummary,
      approvedDatasetSummary,
      loraPlan,
      assetWorkflowIssues,
      steps,
      nextStep
    };
  }, [images, storageBytes, generationJobCount, generationJobs, referenceReviewState, pipeline]);

  function refreshState() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setReferenceReviewState(readReferenceReviewStorage());
    setLetteringLayoutState(readLetteringLayout());
    setStorageBytes(estimateStorageBytes());
    setCopyStatus('Neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyRunbook() {
    const lines = [
      `Ricco Control Room — ${riccoSeries.title}`,
      `Episode ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
      `Review Progress: ${report.progress}%`,
      `Pipeline Progress: ${pipeline.progress}%`,
      `Current Stage: ${pipeline.currentStage.label}`,
      `Current Stage Status: ${pipelineStatusLabel(pipeline.currentStage.status)}`,
      `Finalbilder: ${report.finalPanelCount}/${riccoPanels.length}`,
      `Generation Jobs: ${generationJobCount}`,
      `Assets: ${report.assetSummary.total}`,
      `Needs fix: ${report.fixQueueSummary.total}`,
      `Reference candidates: ${report.referenceCandidateSummary.total}`,
      `Reference candidates missing target: ${report.referenceCandidateSummary.missingTarget}`,
      `Dataset candidates: ${report.datasetCandidateSummary.total}`,
      `Dataset candidates missing target: ${report.datasetCandidateSummary.missingTarget}`,
      `Approved datasets: ${report.assetSummary.statusCounts.approved_dataset}`,
      `Approved datasets ready: ${report.approvedDatasetSummary.ready}`,
      `Approved dataset warnings: ${report.approvedDatasetSummary.warnings}`,
      `LoRA ready targets: ${report.loraPlan.readyTargets}`,
      `LoRA targets need work: ${report.loraPlan.needsWorkTargets}`,
      `LoRA approved items: ${report.loraPlan.totalApprovedItems}`,
      `Reference approved: ${report.references.approved}`,
      `Reference review candidates: ${report.references.candidate}`,
      `Reference redraw: ${report.references.needsRedraw}`,
      `Reference rejected: ${report.references.rejected}`,
      `Offene Punkte: ${report.gateIssues}`,
      `Storage bytes: ${storageBytes}`,
      '',
      'Pipeline:',
      ...pipeline.stages.map((stage) => `- ${stage.label}: ${pipelineStatusLabel(stage.status)} — ${stage.metric} (${stage.route})`),
      '',
      'Steps:',
      ...report.steps.map((step) => `- ${step.title}: ${statusLabel(step.status)} — ${step.note} (${step.route})`),
      '',
      `Next: ${pipeline.currentStage.label} — ${pipeline.currentStage.route}`
    ];

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopyStatus('Runbook kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={report.gateIssues === 0 && report.assetWorkflowIssues === 0 && !report.storageWarning ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Control Room v0.6</p>
        <h2>{riccoSeries.title} · Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        <p className="body-copy">
          Zentraler Produktionsüberblick für Pipeline, Panels, Prompts, Generation Queue, Reference Packs, Asset Workflow, Browser-Speicher, Review-Gate, Lettering, Dataset Export, LoRA Readiness und Package-Backup.
        </p>
        <div className="chips">
          <span>{pipeline.progress}% pipeline</span>
          <span>{report.progress}% review-ready</span>
          <span>Current: {pipeline.currentStage.label}</span>
          <span>{report.finalPanelCount}/{riccoPanels.length} Finalbilder</span>
          <span>{generationJobCount} Generation Jobs</span>
          <span>{report.references.approved} approved refs</span>
          <span>{report.assetSummary.total} assets</span>
          <span>{report.fixQueueSummary.total} needs_fix</span>
          <span>{report.referenceCandidateSummary.total} ref candidates</span>
          <span>{report.datasetCandidateSummary.total} dataset candidates</span>
          <span>{report.assetSummary.statusCounts.approved_dataset} approved datasets</span>
          <span>{report.approvedDatasetSummary.ready} dataset ready</span>
          <span>{report.approvedDatasetSummary.warnings} dataset warnings</span>
          <span>{report.loraPlan.readyTargets} LoRA ready</span>
          <span>{report.loraPlan.needsWorkTargets} LoRA needs work</span>
          <span>{report.gateIssues} QA Punkte</span>
          <span>{Math.round(storageBytes / 1024)} KB Storage</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="primary-button" href={pipeline.currentStage.route}>Nächste Pipeline-Stage: {pipeline.currentStage.label}</a>
          <a className="ghost-link" href="#/ricco-workspace">Workspace Map</a>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
          <a className="ghost-link" href="#/ricco-fix-queue">Fix Queue</a>
          <a className="ghost-link" href="#/ricco-reference-candidates">Reference Candidates</a>
          <a className="ghost-link" href="#/ricco-dataset-candidates">Dataset Candidates</a>
          <a className="ghost-link" href="#/ricco-approved-dataset">Approved Dataset</a>
          <a className="ghost-link" href="#/ricco-lora-training-plan">LoRA Training Plan</a>
          <button className="ghost-button" onClick={refreshState}>Status neu laden</button>
          <button className="ghost-button" onClick={copyRunbook}>Runbook kopieren</button>
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Workspace Pipeline</p>
            <h3>{pipeline.doneCount}/{pipeline.totalStages} Stages done · Current: {pipeline.currentStage.label}</h3>
          </div>
          <span className={`status-badge ${pipelineStatusClass(pipeline.currentStage.status)}`}>
            {pipelineStatusLabel(pipeline.currentStage.status)}
          </span>
        </div>
        <div className="chips">
          <span>{pipeline.progress}% complete</span>
          <span>{pipeline.activeCount} active</span>
          <span>{pipeline.warningCount} needs work</span>
          <span>{pipeline.blockedCount} blocked</span>
          <span>{pipeline.currentStage.metric}</span>
        </div>
        <p className="body-copy">{pipeline.currentStage.nextAction}</p>
        <div className="review-actions">
          <a className="primary-button" href={pipeline.currentStage.route}>Aktuelle Stage öffnen</a>
          <a className="ghost-link" href="#/ricco-workspace">Ganze Pipeline ansehen</a>
        </div>
      </section>

      <div className="grid four-col">
        <div className="card">
          <p className="eyebrow">Characters</p>
          <h3>{riccoCharacters.length}</h3>
          <p className="body-copy">Figurenbasis für die Serie.</p>
        </div>
        <div className="card">
          <p className="eyebrow">References</p>
          <h3>{report.references.approved}</h3>
          <p className="body-copy">Approved references. Ziel Pilot-Test: {MIN_APPROVED_REFERENCES_FOR_PILOT}.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Jobs</p>
          <h3>{generationJobCount}</h3>
          <p className="body-copy">Render-Jobs für ComfyUI manuell/API-ready.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Gate</p>
          <h3>{report.gateIssues === 0 ? 'clear' : report.gateIssues}</h3>
          <p className="body-copy">Fehlende Finals, Rating, Continuity oder Notizen.</p>
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Asset Workflow</p>
            <h3>{report.assetSummary.total} Assets · {report.assetWorkflowIssues} offene Asset-Punkte</h3>
          </div>
          <span className={`status-badge ${report.assetWorkflowIssues === 0 ? 'status-active' : 'status-needs_fix'}`}>{report.assetWorkflowIssues === 0 ? 'clean' : 'needs work'}</span>
        </div>
        <div className="chips">
          <span>{report.assetSummary.finals} finals</span>
          <span>{report.assetSummary.variants} variants</span>
          <span>{report.fixQueueSummary.total} needs_fix</span>
          <span>{report.referenceCandidateSummary.total} ref candidates</span>
          <span>{report.referenceCandidateSummary.missingTarget} ref missing target</span>
          <span>{report.datasetCandidateSummary.total} dataset candidates</span>
          <span>{report.datasetCandidateSummary.missingTarget} dataset missing target</span>
          <span>{report.assetSummary.statusCounts.approved_dataset} approved datasets</span>
          <span>{report.approvedDatasetSummary.ready} approved dataset ready</span>
          <span>{report.approvedDatasetSummary.warnings} approved dataset warnings</span>
          <span>{report.loraPlan.readyTargets} LoRA ready targets</span>
          <span>{report.loraPlan.needsWorkTargets} LoRA needs work</span>
        </div>
        <p className="body-copy">
          Der Asset Workflow verbindet Import, Library, Fix Queue, Reference Candidates, Dataset Candidates, Approved Dataset Export und LoRA Readiness. Freigegebene Trainingsbilder werden erst als Ziel-Checkliste geprüft, bevor später echte Trainingsläufe geplant werden.
        </p>
        <div className="review-actions">
          <a className="primary-button" href="#/ricco-assets">Asset Library öffnen</a>
          <a className="ghost-link" href="#/ricco-fix-queue">Fix Queue</a>
          <a className="ghost-link" href="#/ricco-reference-candidates">Reference Candidates</a>
          <a className="ghost-link" href="#/ricco-dataset-candidates">Dataset Candidates</a>
          <a className="ghost-link" href="#/ricco-approved-dataset">Approved Dataset</a>
          <a className="ghost-link" href="#/ricco-lora-training-plan">LoRA Training Plan</a>
        </div>
      </section>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Reference Pack Status</p>
            <h3>{report.references.approved}/{MIN_APPROVED_REFERENCES_FOR_PILOT} approved für ersten Pilot-Test</h3>
          </div>
          <span className={`status-badge ${statusClass(report.referencesStatus)}`}>{statusLabel(report.referencesStatus)}</span>
        </div>
        <div className="chips">
          <span>{report.references.total} reviewed</span>
          <span>{report.references.approved} approved</span>
          <span>{report.references.candidate} candidates</span>
          <span>{report.references.needsRedraw} redraw</span>
          <span>{report.references.rejected} rejected</span>
        </div>
        <p className="body-copy">
          Für echte Serienkonstanz zuerst Ricco- und Style-Referenzen approven. Danach erst Panel-Batch, LoRA oder API-Automation ernsthaft hochziehen.
        </p>
        <div className="review-actions">
          <a className="primary-button" href="#/ricco-reference-packs">Reference Packs bearbeiten</a>
        </div>
      </section>

      <section className="page-stack compact-stack">
        <div className="section-header">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>Produktionsschritte</h2>
          </div>
          <a className="ghost-link" href="#/ricco-package">Package sichern</a>
        </div>

        {report.steps.map((step) => (
          <article className="card" key={step.title}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{step.route}</p>
                <h3>{step.title}</h3>
              </div>
              <span className={`status-badge ${statusClass(step.status)}`}>{statusLabel(step.status)}</span>
            </div>
            <p className="body-copy">{step.note}</p>
            <div className="review-actions">
              <a className="ghost-link" href={step.route}>öffnen</a>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
