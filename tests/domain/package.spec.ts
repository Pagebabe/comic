import { expect, test } from '@playwright/test';
import {
  buildRiccoPackageFileName,
  buildRiccoProductionPackage,
  extractGenerationJobsFromRiccoPackage,
  extractImagesFromRiccoPackage,
  extractLetteringLayoutStateFromRiccoPackage,
  extractReferenceReviewStateFromRiccoPackage,
  packageLooksLikeRiccoPackage,
  parseRiccoProductionPackage,
  RICCO_PRODUCTION_PACKAGE_VERSION
} from '../../src/domain/package/riccoProductionPackage';
import { normalizeRiccoLetteringLayoutState, updatePanelLetteringLayout } from '../../src/domain/lettering/riccoLetteringLayout';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { ReferenceReviewState } from '../../src/types/riccoReferenceReview';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? '',
    rating: input.rating ?? 5,
    continuityScore: input.continuityScore ?? 5,
    notes: input.notes ?? 'keeper',
    selected: input.selected ?? true,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus,
    assetStatusUpdatedAt: input.assetStatusUpdatedAt,
    referenceCandidateType: input.referenceCandidateType,
    referenceCandidateSubjectId: input.referenceCandidateSubjectId,
    referenceCandidateNotes: input.referenceCandidateNotes,
    referenceCandidateUpdatedAt: input.referenceCandidateUpdatedAt,
    datasetCandidateTargetType: input.datasetCandidateTargetType,
    datasetCandidateTargetId: input.datasetCandidateTargetId,
    datasetTriggerWord: input.datasetTriggerWord,
    datasetCaption: input.datasetCaption,
    datasetNotes: input.datasetNotes,
    datasetUpdatedAt: input.datasetUpdatedAt
  };
}

function makeJob(input: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: input.id ?? 'job_1',
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: input.subjectId ?? 'panel_001',
    episodeId: input.episodeId ?? 'ep_001',
    panelId: input.panelId ?? 'panel_001',
    promptId: input.promptId ?? 'prompt_001',
    workflowId: input.workflowId ?? 'WF-006',
    workflowVersion: input.workflowVersion ?? 'v1',
    positivePrompt: input.positivePrompt ?? 'positive',
    negativePrompt: input.negativePrompt ?? 'negative',
    modelId: 'model_sdxl_comic_v1',
    loraIds: [],
    seed: 100001,
    sampler: 'DPM++ 2M Karras',
    steps: 30,
    cfg: 7,
    resolutionWidth: 1216,
    resolutionHeight: 832,
    batchSize: 1,
    batchCount: 4,
    outputPath: '/generated/panel_001/',
    status: input.status ?? 'completed_manual',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
    notes: input.notes
  };
}

const referenceReviewState: ReferenceReviewState = {
  'char_ricco::front': {
    status: 'approved_reference',
    imagePath: 'public/references/characters/ricco/front_v1.png',
    notes: 'identity locked',
    updatedAt: '2026-07-05T00:00:00.000Z'
  }
};

test('builds production package v5 with reference review final image lettering pipeline asset workflow and dataset state', () => {
  const image = makeImage({ generationJobId: 'job_1', promptId: 'prompt_001' });
  const datasetImage = makeImage({
    id: 'dataset_1',
    selected: false,
    generationJobId: 'job_1',
    assetStatus: 'dataset_candidate',
    datasetCandidateTargetType: 'character_lora',
    datasetCandidateTargetId: 'lora_char_ricco',
    datasetTriggerWord: 'ricco_rih',
    datasetCaption: 'ricco_rih, clean face',
    datasetNotes: 'usable training image'
  });
  const referenceCandidateImage = makeImage({
    id: 'reference_1',
    selected: false,
    assetStatus: 'reference_candidate',
    referenceCandidateType: 'character',
    referenceCandidateSubjectId: 'char_ricco',
    referenceCandidateNotes: 'good face reference'
  });
  const fixImage = makeImage({ id: 'fix_1', selected: false, assetStatus: 'needs_fix' });
  const job = makeJob({ id: 'job_1', promptId: 'prompt_001' });
  const letteringLayoutState = updatePanelLetteringLayout(normalizeRiccoLetteringLayoutState({}), 'panel_001', { text: 'edited bubble' }, '2026-07-05T00:00:00.000Z');
  const pkg = buildRiccoProductionPackage({
    images: [image, datasetImage, referenceCandidateImage, fixImage],
    generationJobs: [job],
    referenceReviewState,
    letteringLayoutState,
    generatedAt: '2026-07-05T00:00:00.000Z'
  });

  expect(pkg.packageVersion).toBe(RICCO_PRODUCTION_PACKAGE_VERSION);
  expect(pkg.reviewState.finalImageCount).toBe(1);
  expect(pkg.generationState.totalJobs).toBe(1);
  expect(pkg.referenceState.referenceReviewSummary.approved).toBe(1);
  expect(pkg.letteringState.totalLayouts).toBe(8);
  expect(pkg.letteringState.editedPanelCount).toBe(1);
  expect(pkg.letteringState.layoutState.panel_001.text).toBe('edited bubble');
  expect(pkg.pipelineState.snapshot.stages).toHaveLength(14);
  expect(pkg.pipelineState.snapshot.stages.some((stage) => stage.id === 'approved-dataset')).toBe(true);
  expect(pkg.pipelineState.snapshot.stages.some((stage) => stage.id === 'lora-plan')).toBe(true);
  expect(pkg.assetWorkflowState.assetSummary.total).toBe(4);
  expect(pkg.assetWorkflowState.fixQueueSummary.total).toBe(1);
  expect(pkg.assetWorkflowState.referenceCandidateSummary.total).toBe(1);
  expect(pkg.assetWorkflowState.datasetCandidateSummary.total).toBe(1);
  expect(pkg.assetWorkflowState.statusMetadataImageCount).toBe(3);
  expect(pkg.assetWorkflowState.referenceMetadataImageCount).toBe(1);
  expect(pkg.assetWorkflowState.datasetMetadataImageCount).toBe(1);
  expect(pkg.datasetState.manifestVersion).toBe('ricco-dataset-manifest-v1');
  expect(pkg.datasetState.totalItems).toBe(1);
  expect(pkg.datasetState.manifest.items[0]).toMatchObject({ imageId: 'dataset_1', triggerWord: 'ricco_rih', caption: 'ricco_rih, clean face' });
  expect(pkg.panels.find((panel) => panel.id === 'panel_001')?.finalImage?.id).toBe(image.id);
});

test('parses package JSON and rejects broken JSON', () => {
  const pkg = buildRiccoProductionPackage({ images: [], generationJobs: [], referenceReviewState: {}, generatedAt: '2026-07-05T00:00:00.000Z' });

  expect(parseRiccoProductionPackage(JSON.stringify(pkg))?.packageVersion).toBe(RICCO_PRODUCTION_PACKAGE_VERSION);
  expect(parseRiccoProductionPackage('{broken')).toBeNull();
  expect(packageLooksLikeRiccoPackage(pkg)).toBe(true);
});

test('extracts and dedupes stored and panel final images from package', () => {
  const stored = makeImage({ id: 'same', selected: false, notes: 'stored' });
  const final = makeImage({ id: 'same', selected: true, notes: 'final' });
  const images = extractImagesFromRiccoPackage({
    panels: [{ id: 'panel_001', finalImage: final }],
    reviewState: { storedImages: [stored] }
  });

  expect(images).toHaveLength(1);
  expect(images[0]).toMatchObject({ id: 'same', selected: true, notes: 'final' });
});

test('extracts and dedupes generation jobs from direct and panel payloads', () => {
  const direct = makeJob({ id: 'same', status: 'queued', notes: 'direct' });
  const panel = makeJob({ id: 'same', status: 'completed_manual', notes: 'panel' });
  const jobs = extractGenerationJobsFromRiccoPackage({
    panels: [{ id: 'panel_001', generationJobs: [panel] }],
    generationState: { generationJobs: [direct] }
  });

  expect(jobs).toHaveLength(1);
  expect(jobs[0]).toMatchObject({ id: 'same', status: 'completed_manual', notes: 'panel' });
});

test('extracts normalized reference review state from package', () => {
  const restored = extractReferenceReviewStateFromRiccoPackage({
    referenceState: { referenceReviewState }
  });

  expect(restored['char_ricco::front'].status).toBe('approved_reference');
});

test('extracts normalized lettering layout state from package', () => {
  const layoutState = updatePanelLetteringLayout(normalizeRiccoLetteringLayoutState({}), 'panel_001', { text: 'restore me' }, '2026-07-05T00:00:00.000Z');
  const restored = extractLetteringLayoutStateFromRiccoPackage({
    letteringState: { layoutState }
  });

  expect(Object.keys(restored)).toHaveLength(8);
  expect(restored.panel_001.text).toBe('restore me');
});

test('builds deterministic package file names by date', () => {
  expect(buildRiccoPackageFileName(new Date('2026-07-05T12:00:00.000Z'))).toBe('ricco-im-haus-episode-001-package-2026-07-05.json');
});
