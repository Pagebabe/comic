import { expect, test } from '@playwright/test';
import {
  buildDatasetCandidateItems,
  buildDatasetCandidateReport,
  buildDatasetCandidateTargets,
  buildDatasetManifest,
  resolveDatasetCandidate,
  slugTriggerWord,
  summarizeDatasetCandidates,
  updateDatasetCandidateMetadata
} from '../../src/domain/assets/riccoDatasetCandidates';
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
    notes: input.notes ?? 'good dataset candidate',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus,
    assetStatusUpdatedAt: input.assetStatusUpdatedAt,
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

test('builds dataset targets and slug trigger words', () => {
  const targets = buildDatasetCandidateTargets();

  expect(slugTriggerWord('Basti Prenzl')).toBe('basti_prenzl');
  expect(targets.some((target) => target.type === 'character_lora' && target.triggerWord === 'ricco_rih')).toBe(true);
  expect(targets.some((target) => target.type === 'location_lora')).toBe(true);
  expect(targets.some((target) => target.type === 'style_lora')).toBe(true);
});

test('builds dataset candidate items only from dataset_candidate assets', () => {
  const items = buildDatasetCandidateItems([
    makeImage({ id: 'candidate', assetStatus: 'dataset_candidate', generationJobId: 'job_1' }),
    makeImage({ id: 'raw', assetStatus: 'raw' })
  ], [makeJob({ id: 'job_1' })]);

  expect(items).toHaveLength(1);
  expect(items[0].image.id).toBe('candidate');
  expect(items[0].targetLabel).toBe('No dataset target set');
  expect(items[0].caption).toContain('gritty adult cartoon');
  expect(items[0].generationJob?.id).toBe('job_1');
});

test('updates dataset metadata explicitly', () => {
  const images = [makeImage({ id: 'candidate', assetStatus: 'dataset_candidate' })];
  const updated = updateDatasetCandidateMetadata(images, 'candidate', {
    targetType: 'character_lora',
    targetId: 'lora_char_ricco',
    triggerWord: 'ricco_rih',
    caption: 'ricco_rih, front view',
    notes: 'clean identity'
  }, '2026-07-05T00:00:00.000Z');

  expect(updated[0]).toMatchObject({
    assetStatus: 'dataset_candidate',
    datasetCandidateTargetType: 'character_lora',
    datasetCandidateTargetId: 'lora_char_ricco',
    datasetTriggerWord: 'ricco_rih',
    datasetCaption: 'ricco_rih, front view',
    datasetNotes: 'clean identity',
    datasetUpdatedAt: '2026-07-05T00:00:00.000Z'
  });
});

test('summarizes dataset candidates by target type and captions', () => {
  const items = buildDatasetCandidateItems([
    makeImage({ id: 'character', assetStatus: 'dataset_candidate', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetCaption: 'ricco_rih, face' }),
    makeImage({ id: 'location', assetStatus: 'dataset_candidate', datasetCandidateTargetType: 'location_lora', datasetCandidateTargetId: 'lora_loc_riccos_zimmer' }),
    makeImage({ id: 'style', assetStatus: 'dataset_candidate', datasetCandidateTargetType: 'style_lora', datasetCandidateTargetId: 'style_rih_gritty_cartoon', generationJobId: 'job_1' }),
    makeImage({ id: 'missing', assetStatus: 'dataset_candidate' })
  ], [makeJob({ id: 'job_1' })]);

  expect(summarizeDatasetCandidates(items)).toEqual({
    total: 4,
    withTarget: 3,
    missingTarget: 1,
    characterLora: 1,
    locationLora: 1,
    styleLora: 1,
    linkedToJobs: 1,
    captioned: 4
  });
});

test('builds dataset manifest and report', () => {
  const items = buildDatasetCandidateItems([
    makeImage({ id: 'candidate', assetStatus: 'dataset_candidate', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'ricco_rih, clean face' })
  ], []);
  const manifest = buildDatasetManifest(items, '2026-07-05T00:00:00.000Z');
  const report = buildDatasetCandidateReport(items);

  expect(manifest.manifestVersion).toBe('ricco-dataset-manifest-v1');
  expect(manifest.totalItems).toBe(1);
  expect(manifest.items[0]).toMatchObject({ imageId: 'candidate', triggerWord: 'ricco_rih', caption: 'ricco_rih, clean face' });
  expect(report).toContain('Ricco Dataset Candidate Report');
  expect(report).toContain('Total candidates: 1');
});

test('resolves dataset candidates only to allowed statuses', () => {
  const images = [makeImage({ id: 'candidate', assetStatus: 'dataset_candidate' })];
  const approved = resolveDatasetCandidate(images, 'candidate', 'approved_dataset', '2026-07-05T00:00:00.000Z');
  const ignored = resolveDatasetCandidate(images, 'candidate', 'reference_candidate', '2026-07-05T00:00:00.000Z');

  expect(approved[0]).toMatchObject({ assetStatus: 'approved_dataset', assetStatusUpdatedAt: '2026-07-05T00:00:00.000Z' });
  expect(ignored[0].assetStatus).toBe('dataset_candidate');
});
