import { expect, test } from '@playwright/test';
import {
  buildFixQueueItems,
  buildFixQueueReport,
  resolveFixQueueItem,
  summarizeFixQueue
} from '../../src/domain/assets/riccoFixQueue';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? 'prompt',
    rating: input.rating ?? 2,
    continuityScore: input.continuityScore ?? 2,
    notes: input.notes ?? 'face off model',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus,
    assetStatusUpdatedAt: input.assetStatusUpdatedAt
  };
}

function makeJob(input: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: input.id ?? 'job_1',
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: input.subjectId ?? 'panel_001',
    episodeId: 'ep_001',
    panelId: input.panelId ?? 'panel_001',
    promptId: input.promptId ?? 'prompt_001',
    workflowId: input.workflowId ?? 'WF-006',
    workflowVersion: input.workflowVersion ?? 'v1',
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
    outputPath: '/generated/panel_001/',
    status: input.status ?? 'completed_manual',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z'
  };
}

test('builds fix queue only from needs_fix assets', () => {
  const items = buildFixQueueItems([
    makeImage({ id: 'fix', assetStatus: 'needs_fix', generationJobId: 'job_1' }),
    makeImage({ id: 'raw', assetStatus: 'raw' }),
    makeImage({ id: 'final', selected: true })
  ], [makeJob({ id: 'job_1' })]);

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({
    panelTitle: 'Ankunft',
    assetStatus: 'needs_fix',
    fixReason: 'face off model'
  });
  expect(items[0].generationJob?.id).toBe('job_1');
});

test('summarizes linked unlinked panel and source information', () => {
  const items = buildFixQueueItems([
    makeImage({ id: 'a', panelId: 'panel_001', assetStatus: 'needs_fix', generationJobId: 'job_1', imageUrl: 'data:image/png;base64,abc' }),
    makeImage({ id: 'b', panelId: 'panel_002', assetStatus: 'needs_fix', imageUrl: '/generated/panel_002.png' })
  ], [makeJob({ id: 'job_1', panelId: 'panel_001' })]);

  expect(summarizeFixQueue(items)).toEqual({
    total: 2,
    linkedToJobs: 1,
    unlinked: 1,
    panelsAffected: 2,
    localImages: 1,
    urlImages: 1
  });
});

test('builds readable fix queue report', () => {
  const items = buildFixQueueItems([makeImage({ id: 'fix', assetStatus: 'needs_fix', generationJobId: 'job_1' })], [makeJob({ id: 'job_1' })]);
  const report = buildFixQueueReport(items);

  expect(report).toContain('Ricco Fix Queue Report');
  expect(report).toContain('Needs fix: 1');
  expect(report).toContain('Panel 1: Ankunft');
  expect(report).toContain('face off model');
});

test('resolves fix queue items only to allowed statuses', () => {
  const images = [makeImage({ id: 'fix', assetStatus: 'needs_fix' })];
  const fixed = resolveFixQueueItem(images, 'fix', 'fixed', '2026-07-05T00:00:00.000Z');
  const ignored = resolveFixQueueItem(images, 'fix', 'dataset_candidate', '2026-07-05T00:00:00.000Z');

  expect(fixed[0]).toMatchObject({ assetStatus: 'fixed', assetStatusUpdatedAt: '2026-07-05T00:00:00.000Z' });
  expect(ignored[0].assetStatus).toBe('needs_fix');
});
