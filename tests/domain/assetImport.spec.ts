import { expect, test } from '@playwright/test';
import {
  buildAssetImportRows,
  buildRiccoImagesFromAssetRows,
  inferPanelIdFromAssetPath,
  normalizeAssetPath
} from '../../src/domain/assets/riccoAssetImport';
import type { GenerationJob } from '../../src/types/productionBackend';

function makeJob(panelId: string, status: GenerationJob['status'], id = `${panelId}_${status}`): GenerationJob {
  return {
    id,
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: panelId,
    episodeId: 'ep_001',
    panelId,
    promptId: `${panelId}_prompt`,
    workflowId: 'WF-006',
    workflowVersion: 'v1',
    positivePrompt: `positive ${panelId}`,
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
    status,
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
    notes: id
  };
}

test('normalizes public asset paths', () => {
  expect(normalizeAssetPath('public/generated/panel_001_v1.png')).toBe('/generated/panel_001_v1.png');
  expect(normalizeAssetPath('./generated/panel_001_v1.png')).toBe('/generated/panel_001_v1.png');
  expect(normalizeAssetPath('https://example.com/panel.png')).toBe('https://example.com/panel.png');
});

test('infers panel ids from common file names', () => {
  expect(inferPanelIdFromAssetPath('/generated/panel_001_v1.png', 'fallback')).toBe('panel_001');
  expect(inferPanelIdFromAssetPath('/generated/p03_fix_face.jpg', 'fallback')).toBe('panel_003');
  expect(inferPanelIdFromAssetPath('/generated/04_variant.webp', 'fallback')).toBe('panel_004');
  expect(inferPanelIdFromAssetPath('/generated/no-panel-name.png', 'fallback')).toBe('fallback');
});

test('builds import rows and auto-links best matching generation jobs', () => {
  const jobs = [makeJob('panel_001', 'queued', 'queued_job'), makeJob('panel_001', 'completed_manual', 'completed_job')];
  const rows = buildAssetImportRows({
    rawInput: '/generated/panel_001_v1.png\nnotes.txt',
    fallbackPanelId: 'panel_002',
    generationJobs: jobs,
    createId: () => 'row_id'
  });

  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    normalizedPath: '/generated/panel_001_v1.png',
    panelId: 'panel_001',
    generationJobId: 'completed_job',
    jobMatch: 'auto_panel_match',
    valid: true
  });
  expect(rows[1]).toMatchObject({ valid: false, jobMatch: 'none' });
});

test('creates review images from valid rows', () => {
  const jobs = [makeJob('panel_001', 'completed_manual', 'completed_job')];
  const rows = buildAssetImportRows({
    rawInput: '/generated/panel_001_v1.png',
    fallbackPanelId: 'panel_001',
    generationJobs: jobs,
    createId: () => 'row_id'
  });
  const images = buildRiccoImagesFromAssetRows({
    rows,
    generationJobs: jobs,
    createdAt: '2026-07-05T00:00:00.000Z',
    createId: () => 'img_id'
  });

  expect(images).toHaveLength(1);
  expect(images[0]).toMatchObject({
    id: 'img_id',
    panelId: 'panel_001',
    imageUrl: '/generated/panel_001_v1.png',
    source: 'generation_job_public_asset',
    generationJobId: 'completed_job',
    promptId: 'panel_001_prompt'
  });
});
