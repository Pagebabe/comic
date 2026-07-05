import { expect, test } from '@playwright/test';
import {
  buildAssetLibraryItems,
  buildAssetLibraryReport,
  DEFAULT_ASSET_LIBRARY_FILTERS,
  filterAssetLibraryItems,
  statusClassForAsset,
  statusForAsset,
  summarizeAssetLibrary,
  updateAssetStatus
} from '../../src/domain/assets/riccoAssetLibrary';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? 'prompt text',
    rating: input.rating ?? 5,
    continuityScore: input.continuityScore ?? 5,
    notes: input.notes ?? 'notes',
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

test('builds asset library items with panel job and status metadata', () => {
  const items = buildAssetLibraryItems([
    makeImage({ id: 'variant', panelId: 'panel_001', selected: false }),
    makeImage({ id: 'final', panelId: 'panel_001', selected: true, generationJobId: 'job_1' })
  ], [makeJob({ id: 'job_1', panelId: 'panel_001' })]);

  expect(items).toHaveLength(2);
  expect(items[0].image.id).toBe('final');
  expect(items[0].panelTitle).toBe('Ankunft');
  expect(items[0].generationJob?.id).toBe('job_1');
  expect(items[0].isFinal).toBe(true);
  expect(items[0].assetStatus).toBe('approved_panel');
  expect(items[1].assetStatus).toBe('raw');
});

test('summarizes finals variants local/url images job links and status counts', () => {
  const items = buildAssetLibraryItems([
    makeImage({ id: 'final', selected: true, generationJobId: 'job_1', imageUrl: 'data:image/png;base64,abc', source: 'local_file' }),
    makeImage({ id: 'variant', selected: false, imageUrl: '/generated/panel_001.png', source: 'public_asset', assetStatus: 'needs_fix' })
  ], [makeJob({ id: 'job_1' })]);
  const summary = summarizeAssetLibrary(items);

  expect(summary).toMatchObject({
    total: 2,
    finals: 1,
    variants: 1,
    localImages: 1,
    urlImages: 1,
    linkedToJobs: 1,
    unlinked: 1
  });
  expect(summary.statusCounts.approved_panel).toBe(1);
  expect(summary.statusCounts.needs_fix).toBe(1);
  expect(summary.sources).toEqual(['local_file', 'public_asset']);
});

test('filters by panel final state source status job link and query', () => {
  const items = buildAssetLibraryItems([
    makeImage({ id: 'final', panelId: 'panel_001', selected: true, generationJobId: 'job_1', source: 'public_asset', notes: 'keeper' }),
    makeImage({ id: 'variant', panelId: 'panel_002', selected: false, source: 'manual_url', notes: 'trash', assetStatus: 'dataset_candidate' })
  ], [makeJob({ id: 'job_1', panelId: 'panel_001', status: 'imported_as_asset' })]);

  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, panelId: 'panel_001' }).map((item) => item.image.id)).toEqual(['final']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, finalFilter: 'variant' }).map((item) => item.image.id)).toEqual(['variant']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, jobFilter: 'linked' }).map((item) => item.image.id)).toEqual(['final']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, source: 'manual_url' }).map((item) => item.image.id)).toEqual(['variant']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, status: 'dataset_candidate' }).map((item) => item.image.id)).toEqual(['variant']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, query: 'keeper' }).map((item) => item.image.id)).toEqual(['final']);
  expect(filterAssetLibraryItems(items, { ...DEFAULT_ASSET_LIBRARY_FILTERS, query: 'dataset_candidate' }).map((item) => item.image.id)).toEqual(['variant']);
});

test('updates asset status immutably', () => {
  const images = [makeImage({ id: 'a' }), makeImage({ id: 'b' })];
  const updated = updateAssetStatus(images, 'a', 'reference_candidate', '2026-07-05T00:00:00.000Z');

  expect(updated.find((image) => image.id === 'a')).toMatchObject({
    assetStatus: 'reference_candidate',
    assetStatusUpdatedAt: '2026-07-05T00:00:00.000Z'
  });
  expect(updated.find((image) => image.id === 'b')?.assetStatus).toBeUndefined();
});

test('derives default status and status classes', () => {
  expect(statusForAsset(makeImage({ selected: true }))).toBe('approved_panel');
  expect(statusForAsset(makeImage({ selected: false }))).toBe('raw');
  expect(statusClassForAsset('approved_panel')).toBe('status-active');
  expect(statusClassForAsset('needs_fix')).toBe('status-rejected');
  expect(statusClassForAsset('dataset_candidate')).toBe('status-needs_fix');
});

test('builds readable asset library report with status details', () => {
  const items = buildAssetLibraryItems([makeImage({ id: 'final', selected: true })], []);
  const report = buildAssetLibraryReport(items);

  expect(report).toContain('Ricco Asset Library Report');
  expect(report).toContain('Finals: 1');
  expect(report).toContain('approved_panel: 1');
  expect(report).toContain('Panel 1: Ankunft');
});
