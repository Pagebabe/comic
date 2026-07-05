import { riccoPanels } from '../../data/riccoStudio';
import { buildRiccoExportReadiness, buildRiccoQAReportItems, summarizeRiccoQAItems } from '../export/riccoExportState';
import { summarizeGenerationQueue } from '../generation/riccoGenerationQueue';
import { defaultPanelLetteringLayout, normalizeRiccoLetteringLayoutState, type RiccoLetteringLayoutState } from '../lettering/riccoLetteringLayout';
import { summarizeRiccoReviewImages } from '../review/riccoReviewState';
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
  const generationSummary = summarizeGenerationQueue(input.generationJobs);
  const reviewSummary = summarizeRiccoReviewImages(input.images);
  const exportReadiness = buildRiccoExportReadiness(input.images);
  const qaSummary = summarizeRiccoQAItems(buildRiccoQAReportItems(input.images));
  const editedLetteringPanels = countEditedLetteringPanels(input.letteringLayoutState ?? normalizeRiccoLetteringLayoutState({}));
  const panelCount = riccoPanels.length;
  const generationPanelCount = new Set(input.generationJobs.map((job) => job.panelId).filter(Boolean)).size;
  const importedJobCount = input.generationJobs.filter((job) => job.status === 'imported_as_asset').length;

  const stages: RiccoPipelineStage[] = [
    { id: 'story', label: 'Story / Panels', department: 'Story', route: '#/ricco-studio', status: 'done', metric: `${panelCount}/${panelCount} panels`, nextAction: 'Review panel brief.' },
    { id: 'references', label: 'Reference Packs', department: 'Art', route: '#/ricco-reference-packs', status: referenceSummary.approved >= 4 ? 'done' : referenceSummary.total > 0 ? 'active' : 'warning', metric: `${referenceSummary.approved} approved refs`, nextAction: referenceSummary.approved >= 4 ? 'Keep references locked.' : 'Approve core references.' },
    { id: 'generation', label: 'Generation Queue', department: 'Render', route: '#/ricco-generation-queue', status: generationPanelCount >= panelCount ? 'done' : input.generationJobs.length > 0 ? 'active' : referenceSummary.approved > 0 ? 'warning' : 'blocked', metric: `${generationPanelCount}/${panelCount} panels queued`, nextAction: generationPanelCount >= panelCount ? 'Render or import outputs.' : 'Create missing jobs.' },
    { id: 'import', label: 'Asset Import', department: 'Intake', route: '#/ricco-asset-import', status: input.images.length > 0 ? 'done' : input.generationJobs.length > 0 ? 'active' : 'blocked', metric: `${input.images.length} images · ${importedJobCount} imported jobs`, nextAction: input.images.length > 0 ? 'Continue to review.' : 'Import generated assets.' },
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
