import { expect, test } from '@playwright/test';
import {
  buildRiccoStorageReport,
  buildRiccoStorageReportText,
  formatBytes,
  keepOnlyFinalReviewImages,
  removeLocalNonFinalReviewImages,
  STORAGE_DANGER_BYTES,
  STORAGE_WARNING_BYTES,
  storageLevel
} from '../../src/domain/review/riccoReviewState';
import type { GenerationJob } from '../../src/types/productionBackend';
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
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId
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
    status: input.status ?? 'queued',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
    notes: input.notes
  };
}

test('formats bytes and classifies storage level', () => {
  expect(formatBytes(512)).toBe('512 B');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(storageLevel(STORAGE_WARNING_BYTES - 1)).toBe('ok');
  expect(storageLevel(STORAGE_WARNING_BYTES)).toBe('warning');
  expect(storageLevel(STORAGE_DANGER_BYTES)).toBe('danger');
});

test('builds storage report with finals local images jobs and missing panels', () => {
  const images = [
    makeImage({ id: 'final', panelId: 'panel_001', selected: true, imageUrl: 'data:image/png;base64,abc', generationJobId: 'job_1' }),
    makeImage({ id: 'url_variant', panelId: 'panel_001', selected: false, imageUrl: '/generated/panel_001_v2.png' }),
    makeImage({ id: 'local_variant', panelId: 'panel_002', selected: false, imageUrl: 'data:image/png;base64,def' })
  ];
  const jobs = [
    makeJob({ id: 'job_1', panelId: 'panel_001', status: 'imported_as_asset' }),
    makeJob({ id: 'job_2', panelId: 'panel_002', status: 'queued' })
  ];

  const report = buildRiccoStorageReport({
    images,
    generationJobs: jobs,
    rawBytes: STORAGE_WARNING_BYTES,
    generationJobBytes: 100
  });

  expect(report.level).toBe('warning');
  expect(report.finalImages.map((image) => image.id)).toEqual(['final']);
  expect(report.localImages.map((image) => image.id)).toEqual(['final', 'local_variant']);
  expect(report.urlImages.map((image) => image.id)).toEqual(['url_variant']);
  expect(report.importedJobs.map((job) => job.id)).toEqual(['job_1']);
  expect(report.generationLinkedImages.map((image) => image.id)).toEqual(['final']);
  expect(report.missingFinals.length).toBeGreaterThan(0);
  expect(report.byPanel.find((item) => item.panel.id === 'panel_001')?.images).toHaveLength(2);
});

test('keeps only final review images for safe cleanup', () => {
  const images = [
    makeImage({ id: 'final', selected: true }),
    makeImage({ id: 'variant', selected: false })
  ];

  expect(keepOnlyFinalReviewImages(images).map((image) => image.id)).toEqual(['final']);
});

test('removes only local non-final data urls while preserving finals and urls', () => {
  const images = [
    makeImage({ id: 'final_local', selected: true, imageUrl: 'data:image/png;base64,abc' }),
    makeImage({ id: 'variant_local', selected: false, imageUrl: 'data:image/png;base64,def' }),
    makeImage({ id: 'variant_url', selected: false, imageUrl: '/generated/panel_001_v2.png' })
  ];

  expect(removeLocalNonFinalReviewImages(images).map((image) => image.id)).toEqual(['final_local', 'variant_url']);
});

test('builds readable storage report text', () => {
  const images = [makeImage({ id: 'final', selected: true })];
  const jobs = [makeJob({ id: 'job_1', status: 'imported_as_asset' })];
  const report = buildRiccoStorageReport({ images, generationJobs: jobs, rawBytes: 2048, generationJobBytes: 1024 });
  const text = buildRiccoStorageReportText({
    report,
    rawBytes: 2048,
    generationJobBytes: 1024,
    imageCount: images.length,
    generationJobCount: jobs.length
  });

  expect(text).toContain('Ricco Storage Report');
  expect(text).toContain('Final images: 1');
  expect(text).toContain('Generation jobs: 1');
  expect(text).toContain('By panel:');
});
