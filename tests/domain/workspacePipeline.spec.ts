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

function makeImage(panelId: string): RiccoPanelImage {
  return {
    id: `img_${panelId}`,
    panelId,
    imageUrl: `/generated/${panelId}.png`,
    source: 'generation_job_public_asset',
    promptUsed: 'positive',
    rating: 5,
    continuityScore: 5,
    notes: 'approved',
    selected: true,
    createdAt: '2026-07-05T00:00:00.000Z',
    generationJobId: `job_${panelId}`,
    promptId: `prompt_${panelId}`
  };
}

const approvedReferences: ReferenceReviewState = {
  ricco: { status: 'approved_reference', imagePath: 'a', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  basti: { status: 'approved_reference', imagePath: 'b', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  jule: { status: 'approved_reference', imagePath: 'c', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' },
  don: { status: 'approved_reference', imagePath: 'd', notes: '', updatedAt: '2026-07-05T00:00:00.000Z' }
};

const panelIds = ['panel_001', 'panel_002', 'panel_003', 'panel_004', 'panel_005', 'panel_006', 'panel_007', 'panel_008'];

test('builds initial pipeline with story done and early stages needing work', () => {
  const map = buildRiccoPipelineMap({
    referenceReviewState: {},
    generationJobs: [],
    images: []
  });

  expect(map.stages).toHaveLength(8);
  expect(map.doneCount).toBe(1);
  expect(map.currentStage.id).toBe('references');
  expect(map.stages.find((stage) => stage.id === 'generation')?.status).toBe('blocked');
});

test('marks render and review flow done when all jobs and finals exist', () => {
  const map = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: panelIds.map(makeImage)
  });

  expect(map.stages.find((stage) => stage.id === 'references')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'generation')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'review')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'qa')?.status).toBe('done');
  expect(map.stages.find((stage) => stage.id === 'lettering')?.status).toBe('active');
});

test('counts edited lettering panels and completes lettering stage', () => {
  const defaultLayout = normalizeRiccoLetteringLayoutState({});
  const editedLayout = updatePanelLetteringLayout(defaultLayout, 'panel_001', { text: 'edited bubble' });

  expect(countEditedLetteringPanels(defaultLayout)).toBe(0);
  expect(countEditedLetteringPanels(editedLayout)).toBe(1);

  const map = buildRiccoPipelineMap({
    referenceReviewState: approvedReferences,
    generationJobs: panelIds.map(makeJob),
    images: panelIds.map(makeImage),
    letteringLayoutState: editedLayout
  });

  expect(map.stages.find((stage) => stage.id === 'lettering')?.status).toBe('done');
});
