import { expect, test } from '@playwright/test';
import {
  buildApprovedDatasetCaptionFiles,
  buildApprovedDatasetItems,
  buildApprovedDatasetManifest,
  buildApprovedDatasetReport,
  summarizeApprovedDataset,
  validateApprovedDatasetItem
} from '../../src/domain/assets/riccoApprovedDatasetExport';
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
    notes: input.notes ?? 'approved dataset image',
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

test('builds approved dataset items only from approved_dataset assets', () => {
  const items = buildApprovedDatasetItems([
    makeImage({
      id: 'approved',
      assetStatus: 'approved_dataset',
      generationJobId: 'job_1',
      datasetCandidateTargetType: 'character_lora',
      datasetCandidateTargetId: 'lora_char_ricco',
      datasetTriggerWord: 'ricco_rih',
      datasetCaption: 'ricco_rih, clean face'
    }),
    makeImage({ id: 'candidate', assetStatus: 'dataset_candidate' })
  ], [makeJob({ id: 'job_1' })]);

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ ready: true, triggerWord: 'ricco_rih', caption: 'ricco_rih, clean face' });
  expect(items[0].generationJob?.id).toBe('job_1');
});

test('validates warnings for incomplete approved dataset items', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'bad', assetStatus: 'approved_dataset', rating: 2, continuityScore: 2, datasetCaption: '' })
  ], []);

  expect(validateApprovedDatasetItem(items[0])).toEqual([
    'missing dataset target',
    'missing trigger word',
    'missing caption',
    'rating below 4',
    'continuity below 4'
  ]);
  expect(items[0].ready).toBe(false);
});

test('summarizes ready and warning approved datasets', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'ready', assetStatus: 'approved_dataset', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'ricco_rih, face' }),
    makeImage({ id: 'warn', assetStatus: 'approved_dataset' })
  ], []);

  expect(summarizeApprovedDataset(items)).toMatchObject({
    total: 2,
    ready: 1,
    warnings: 1,
    missingTarget: 1,
    missingTrigger: 1,
    missingCaption: 1,
    characterLora: 1
  });
});

test('builds approved dataset manifest with ready and warning counts', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'ready', assetStatus: 'approved_dataset', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'ricco_rih, face' })
  ], []);
  const manifest = buildApprovedDatasetManifest(items, '2026-07-05T00:00:00.000Z');

  expect(manifest.manifestVersion).toBe('ricco-approved-dataset-manifest-v1');
  expect(manifest.sourceManifestVersion).toBe('ricco-dataset-manifest-v1');
  expect(manifest.readyItems).toBe(1);
  expect(manifest.warningItems).toBe(0);
  expect(manifest.items[0]).toMatchObject({ imageId: 'ready', triggerWord: 'ricco_rih', caption: 'ricco_rih, face' });
});

test('builds caption file list and report', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'ready', imageUrl: '/dataset/ricco_001.png', assetStatus: 'approved_dataset', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'ricco_rih, face' })
  ], []);
  const captionFiles = buildApprovedDatasetCaptionFiles(items);
  const report = buildApprovedDatasetReport(items);

  expect(captionFiles).toEqual([{ imageId: 'ready', imagePath: '/dataset/ricco_001.png', captionFilePath: '/dataset/ricco_001.txt', caption: 'ricco_rih, face' }]);
  expect(report).toContain('Ricco Approved Dataset Export Report');
  expect(report).toContain('READY');
  expect(report).toContain('ricco_rih');
});
