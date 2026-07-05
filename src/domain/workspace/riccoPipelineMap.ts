import { riccoPanels } from '../../data/riccoStudio';
import { buildApprovedDatasetItems, summarizeApprovedDataset } from '../assets/riccoApprovedDatasetExport';
import { buildAssetLibraryItems, summarizeAssetLibrary } from '../assets/riccoAssetLibrary';
import { buildDatasetCandidateItems, summarizeDatasetCandidates } from '../assets/riccoDatasetCandidates';
import { buildFixQueueItems, summarizeFixQueue } from '../assets/riccoFixQueue';
import { buildReferenceCandidateItems, summarizeReferenceCandidates } from '../assets/riccoReferenceCandidates';
import { buildRiccoExportReadiness, buildRiccoQAReportItems, summarizeRiccoQAItems } from '../export/riccoExportState';
import { defaultPanelLetteringLayout, normalizeRiccoLetteringLayoutState, type RiccoLetteringLayoutState } from '../lettering/riccoLetteringLayout';
import { summarizeRiccoReviewImages } from '../review/riccoReviewState';
import { buildLoraTrainingPlan } from '../training/riccoLoraTrainingPlan';
import { summarizeReferenceReviewState, type ReferenceReviewState } from '../../types/riccoReferenceReview';
import type { GenerationJob } from '../../types/productionBackend';
import type { RiccoPanelImage } from '../../types/riccoReview';

export type PipelineStageStatus = 'done' | 'active' | 'warning' | 'blocked';

export type RiccoPipelineStage = {
  id: string;
  label: string;
  department: string;
  route: string;
  status: PipelineStageStatus;
  metric: string;
  nextAction: string;
};

export type RiccoPipelineMap = {
  stages: RiccoPipelineStage[];
  doneCount: number;
  activeCount: number;
  warningCount: number;
  blockedCount: number;
  totalStages: number;
  progress: number;
  currentStage: RiccoPipelineStage;
};

export function pipelineStatusClass(status: PipelineStageStatus) {
  if (status === 'done') return 'status-active';
  if (status === 'blocked') return 'status-rejected';
  return 'status-needs_fix';
}

export function pipelineStatusLabel(status: PipelineStageStatus) {
  if (status === 'done') return 'DONE';
  if (status === 'active') return 'ACTIVE';
  if (status === 'warning') return 'NEEDS WORK';
  return 'BLOCKED';
}

export function countEditedLetteringPanels(layoutState: RiccoLetteringLayoutState) {
  const normalized = normalizeRiccoLetteringLayoutState(layoutState);

  return riccoPanels.filter((panel) => {
    const layout = normalized[panel.id];
    const fallback = defaultPanelLetteringLayout(panel.id, layout.updatedAt);

    return layout.text !== fallback.text || layout.preset !== fallback.preset || layout.x !== fallback.x || layout.y !== fallback.y || layout.width !== fallback.width || layout.fontSize !== fallback.fontSize;
  }).length;
}

export function buildRiccoPipelineMap(input: {
  referenceReviewState: ReferenceReviewState;
  generationJobs: GenerationJob[];
  images: RiccoPanelImage[];
  letteringLayoutState?: RiccoLetteringLayoutState;
}): RiccoPipelineMap {
  const referenceSummary = summarizeReferenceReviewState(input.referenceReviewState);
  const reviewSummary = summarizeRiccoReviewImages(input.images);
  const exportReadiness = buildRiccoExportReadiness(input.images);
  const qaSummary = summarizeRiccoQAItems(buildRiccoQAReportItems(input.images));
  const editedLetteringPanels = countEditedLetteringPanels(input.letteringLayoutState ?? normalizeRiccoLetteringLayoutState({}));
  const panelCount = riccoPanels.length;
  const generationPanelCount = new Set(input.generationJobs.map((job) => job.panelId).filter(Boolean)).size;
  const importedJobCount = input.generationJobs.filter((job) => job.status === 'imported_as_asset').length;
  const assetItems = buildAssetLibraryItems(input.images, input.generationJobs);
  const assetSummary = summarizeAssetLibrary(assetItems);
  const fixQueueSummary = summarizeFixQueue(buildFixQueueItems(input.images, input.generationJobs));
  const referenceCandidateSummary = summarizeReferenceCandidates(buildReferenceCandidateItems(input.images, input.generationJobs));
  const datasetCandidateSummary = summarizeDatasetCandidates(buildDatasetCandidateItems(input.images, input.generationJobs));
  const approvedDatasetSummary = summarizeApprovedDataset(buildApprovedDatasetItems(input.images, input.generationJobs));
  const loraPlan = buildLoraTrainingPlan(input.images, input.generationJobs);

  const stages: RiccoPipelineStage[] = [
    { id: 'story', label: 'Story / Panels', department: 'Story', route: '#/ricco-studio', status: 'done', metric: `${panelCount}/${panelCount} panels`, nextAction: 'Review panel brief.' },
    { id: 'references', label: 'Reference Packs', department: 'Art', route: '#/ricco-reference-packs', status: referenceSummary.approved >= 4 ? 'done' : referenceSummary.total > 0 ? 'active' : 'warning', metric: `${referenceSummary.approved} approved refs`, nextAction: referenceSummary.approved >= 4 ? 'Keep references locked.' : 'Approve core references.' },
    { id: 'generation', label: 'Generation Queue', department: 'Render', route: '#/ricco-generation-queue', status: generationPanelCount >= panelCount ? 'done' : input.generationJobs.length > 0 ? 'active' : referenceSummary.approved > 0 ? 'warning' : 'blocked', metric: `${generationPanelCount}/${panelCount} panels queued`, nextAction: generationPanelCount >= panelCount ? 'Render or import outputs.' : 'Create missing jobs.' },
    { id: 'import', label: 'Asset Import', department: 'Intake', route: '#/ricco-asset-import', status: input.images.length > 0 ? 'done' : input.generationJobs.length > 0 ? 'active' : 'blocked', metric: `${input.images.length} images · ${importedJobCount} imported jobs`, nextAction: input.images.length > 0 ? 'Continue to asset library.' : 'Import generated assets.' },
    { id: 'asset-library', label: 'Asset Library', department: 'Asset Management', route: '#/ricco-assets', status: assetSummary.total > 0 ? 'done' : input.images.length > 0 ? 'active' : 'blocked', metric: `${assetSummary.total} assets · ${assetSummary.statusCounts.approved_panel} approved panels`, nextAction: assetSummary.total > 0 ? 'Classify assets and route candidates.' : 'Import assets first.' },
    { id: 'fix-queue', label: 'Fix Queue', department: 'Repair', route: '#/ricco-fix-queue', status: fixQueueSummary.total > 0 ? 'warning' : assetSummary.total > 0 ? 'done' : 'blocked', metric: `${fixQueueSummary.total} needs_fix`, nextAction: fixQueueSummary.total > 0 ? 'Resolve broken assets.' : 'No repair work open.' },
    { id: 'reference-candidates', label: 'Reference Candidates', department: 'Art Intake', route: '#/ricco-reference-candidates', status: referenceCandidateSummary.missingTarget > 0 ? 'warning' : referenceCandidateSummary.total > 0 ? 'active' : assetSummary.total > 0 ? 'done' : 'blocked', metric: `${referenceCandidateSummary.total} candidates · ${referenceCandidateSummary.withTarget} targeted`, nextAction: referenceCandidateSummary.total > 0 ? 'Assign targets or resolve candidates.' : 'No reference candidates open.' },
    { id: 'dataset-candidates', label: 'Dataset Candidates', department: 'Dataset Prep', route: '#/ricco-dataset-candidates', status: datasetCandidateSummary.missingTarget > 0 ? 'warning' : datasetCandidateSummary.total > 0 ? 'active' : assetSummary.total > 0 ? 'done' : 'blocked', metric: `${datasetCandidateSummary.total} candidates · ${datasetCandidateSummary.captioned} captioned`, nextAction: datasetCandidateSummary.total > 0 ? 'Review trigger words and captions.' : 'No dataset candidates open.' },
    { id: 'approved-dataset', label: 'Approved Dataset Export', department: 'Dataset Export', route: '#/ricco-approved-dataset', status: approvedDatasetSummary.warnings > 0 ? 'warning' : approvedDatasetSummary.total > 0 ? 'done' : assetSummary.total > 0 ? 'active' : 'blocked', metric: `${approvedDatasetSummary.ready}/${approvedDatasetSummary.total} ready · ${approvedDatasetSummary.warnings} warnings`, nextAction: approvedDatasetSummary.total > 0 ? 'Export final approved dataset manifest.' : 'Approve dataset assets when ready.' },
    { id: 'lora-plan', label: 'LoRA Training Plan', department: 'Training Prep', route: '#/ricco-lora-training-plan', status: loraPlan.needsWorkTargets > 0 ? 'warning' : loraPlan.readyTargets > 0 ? 'done' : approvedDatasetSummary.total > 0 ? 'active' : assetSummary.total > 0 ? 'active' : 'blocked', metric: `${loraPlan.readyTargets} ready targets · ${loraPlan.needsWorkTargets} need work`, nextAction: loraPlan.readyTargets > 0 ? 'Review target checklists.' : 'Prepare approved dataset targets first.' },
    { id: 'review', label: 'Image Review', department: 'Review', route: '#/ricco-image-review', status: reviewSummary.finalCount >= panelCount ? 'done' : input.images.length > 0 ? 'active' : 'blocked', metric: `${reviewSummary.finalCount}/${panelCount} finals`, nextAction: reviewSummary.finalCount >= panelCount ? 'Run QA.' : 'Select finals.' },
    { id: 'qa', label: 'QA Gate', department: 'QA', route: '#/ricco-qa', status: qaSummary.passed ? 'done' : qaSummary.blockers.length > 0 ? 'blocked' : 'warning', metric: `${qaSummary.blockers.length} blockers · ${qaSummary.warnings.length} warnings`, nextAction: qaSummary.passed ? 'Proceed to lettering.' : 'Fix QA issues.' },
    { id: 'lettering', label: 'Lettering', department: 'Editorial', route: '#/ricco-lettering', status: exportReadiness.isReady && editedLetteringPanels > 0 ? 'done' : exportReadiness.isReady ? 'active' : 'blocked', metric: `${editedLetteringPanels}/${panelCount} edited layouts`, nextAction: exportReadiness.isReady ? 'Set bubble positions.' : 'Finish review first.' },
    { id: 'package', label: 'Package / Restore', department: 'Archive', route: '#/ricco-package', status: exportReadiness.isReady ? 'done' : reviewSummary.finalCount > 0 ? 'active' : 'blocked', metric: `${exportReadiness.finalCount}/${exportReadiness.totalPanels} package-ready`, nextAction: exportReadiness.isReady ? 'Download package.' : 'Package partial state or finish finals.' }
  ];

  const doneCount = stages.filter((stage) => stage.status === 'done').length;
  const activeCount = stages.filter((stage) => stage.status === 'active').length;
  const warningCount = stages.filter((stage) => stage.status === 'warning').length;
  const blockedCount = stages.filter((stage) => stage.status === 'blocked').length;
  const currentStage = stages.find((stage) => stage.status !== 'done') ?? stages[stages.length - 1];

  return { stages, doneCount, activeCount, warningCount, blockedCount, totalStages: stages.length, progress: Math.round((doneCount / stages.length) * 100), currentStage };
}
