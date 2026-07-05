import { expect, test } from '@playwright/test';
import { buildRiccoPipelineMap, countEditedLetteringPanels } from '../../src/domain/workspace/riccoPipelineMap';
import { normalizeRiccoLetteringLayoutState, updatePanelLetteringLayout } from '../../src/domain/lettering/riccoLetteringLayout';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { ReferenceReviewState } from '../../src/types/riccoReferenceReview';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeJob(panelId: string): GenerationJob {
  return {
    id: `job_${panelId}`,
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: panelId,
    episodeId: 'ep_001',
    panelId,
    promptId: `prompt_${panelId}`,
    workflowId: 'WF-006',
    workflowVersion: 'v1',
    positivePrompt: 'positive',
    negativePrompt: 'negative',
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
    outputPath: `/generated/${panelId}/`,
    status: 'imported_as_asset',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z'
  };
}

function makeImage(panelId: string, patch: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: patch.id ?? `img_${panelId}`,
    panelId,
    imageUrl: patch.imageUrl ?? `/generated/${panelId}.png`,
    source: patch.source ?? 'generation_job_public_asset',
    promptUsed: patch.promptUsed ?? 'positive',
    rating: patch.rating ?? 5,
    continuityScore: patch.continuityScore ?? 5,
    notes: patch.notes ?? 'approved',
    selected: patch.selected ?? true,
    createdAt: patch.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: patch.generationJobId ?? `job_${panelId}`,
    promptId: patch.promptId ?? `prompt_${panelId}`,
    assetStatus: patch.assetStatus,
    assetStatusUpdatedAt: patch.assetStatusUpdatedAt,
    referenceCandidateType: patch.referenceCandidateType,
    referenceCandidateSubjectId: patch.referenceCandidateSubjectId,
    referenceCandidateNotes: patch.referenceCandidateNotes,
    referenceCandidateUpdatedAt: patch.referenceCandidateUpdatedAt,
    datasetCandidateTargetType: patch.datasetCandidateTargetType,
    datasetCandidateTargetId: patch.datasetCandidateTargetId,
    datasetTriggerWord: patch.datasetTriggerWord,
    datasetCaption: patch.datasetCaption,
    datasetNotes: patch.datasetNotes,
    datasetUpdatedAt: patch.datasetUpdatedAt
  };
}

const approvedReferences: ReferenceReviewState = {
  ricco: { status: 'approved_reference', imagePath: 'a', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  basti: { status: 'approved_reference', imagePath: 'b', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  jule: { status: 'approved_reference', imagePath: 'c', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  don: { status: 'approved_reference', imagePath: 'd', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' }
};

const panelIds = ['panel_001', 'panel_002', 'panel_003', 'panel_004', 'panel_005', 'panel_006', 'panel_007', 'panel_008'];

test('builds initial pipeline with story done and asset stages blocked', () => {
  const map = buildRiccoPipelineMap({
    referenceReviewState: {},
    generationJobs: [],
    images: []
  });

  expect(map.stages).toHaveLength(13);
  expect(map.doneCount).toBe(1);
  expect(map.currentStage.id).toBe('references');
  expect(map.stages.find((stage) => stage.id === 'generation')?.status).toBe('blocked');
  expect(map.stages.find((stage) => stage.id === 'asset-library')?.status).toBe('blocked');
  expect(map.stages.find((stage) => stage.id === 'approved-dataset')?.status).toBe('blocked');
});

test('marks render review and clean asset workflow stages when all jobs and finals exist', () => {
  const map = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: panelIds.map((panelId) => makeImage(panelId))
  });

  expect(map.stages.find((stage) => stage.id === 'references')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'generation')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'asset-library')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'fix-queue')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'reference-candidates')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'dataset-candidates')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'approved-dataset')?.status).toBe('active');
  expect(map.stages.find((stage) => stage.id === 'review')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'qa')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'lettering')?.status).toBe('active');
});

test('surfaces asset workflow warnings for fix and untargeted candidates', () => {
  const map = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: [
      makeImage('panel_001', { id: 'needs_fix', selected: false, assetStatus: 'needs_fix' }),
      makeImage('panel_002', { id: 'ref_candidate', selected: false, assetStatus: 'reference_candidate' }),
      makeImage('panel_003', { id: 'dataset_candidate', selected: false, assetStatus: 'dataset_candidate' })
    ]
  });

  expect(map.stages.find((stage) => stage.id === 'fix-queue')?.status).toBe('warning');
  expect(map.stages.find((stage) => stage.id === 'reference-candidates')?.status).toBe('warning');
  expect(map.stages.find((stage) => stage.id === 'dataset-candidates')?.status).toBe('warning');
  expect(map.stages.find((stage) => stage.id === 'fix-queue')?.metric).toContain('1 needs_fix');
});

test('surfaces approved dataset ready and warning states', () => {
  const ready = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: [makeImage('panel_001', {
      id: 'approved_ready',
      selected: false,
      assetStatus: 'approved_dataset',
      datasetCandidateTargetType: 'character_lora',
      datasetCandidateTargetId: 'lora_char_ricco',
      datasetTriggerWord: 'ricco_rih',
      datasetCaption: 'ricco_rih, clean face'
    })]
  });
  const warning = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: [makeImage('panel_001', {
      id: 'approved_warn',
      selected: false,
      assetStatus: 'approved_dataset',
      rating: 2,
      datasetCaption: ''
    })]
  });

  expect(ready.stages.find((stage) => stage.id === 'approved-dataset')?.status).toBe('done');
  expect(ready.stages.find((stage) => stage.id === 'approved-dataset')?.metric).toContain('1/1 ready');
  expect(warning.stages.find((stage) => stage.id === 'approved-dataset')?.status).toBe('warning');
});

test('counts edited lettering panels and completes lettering stage', () => {
  const defaultLayout = normalizeRiccoLetteringLayoutState({});
  const editedLayout = updatePanelLetteringLayout(defaultLayout, 'panel_001', { text: 'edited bubble' });

  expect(countEditedLetteringPanels(defaultLayout)).toBe(0);
  expect(countEditedLetteringPanels(editedLayout)).toBe(1);

  const map = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: panelIds.map((panelId) => makeImage(panelId)),
    letteringLayoutState: editedLayout
  });

  expect(map.stages.find((stage) => stage.id === 'lettering')?.status).toBe('done');
});
