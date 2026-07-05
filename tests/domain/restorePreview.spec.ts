import { expect, test } from '@playwright/test';
import { buildRiccoProductionPackage, parseRiccoProductionPackage } from '../../src/domain/package/riccoProductionPackage';
import { buildRiccoRestorePreview, buildRiccoRestoreStatusText } from '../../src/domain/package/riccoRestorePreview';
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
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus,
    referenceCandidateType: input.referenceCandidateType,
    referenceCandidateSubjectId: input.referenceCandidateSubjectId,
    referenceCandidateNotes: input.referenceCandidateNotes,
    datasetCandidateTargetType: input.datasetCandidateTargetType,
    datasetCandidateTargetId: input.datasetCandidateTargetId,
    datasetTriggerWord: input.datasetTriggerWord,
    datasetCaption: input.datasetCaption,
    datasetNotes: input.datasetNotes
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

const referenceReviewState: ReferenceReviewState = {
  ref_1: {
    status: 'approved_reference',
    imagePath: '/references/ricco.png',
    notes: 'locked',
    updatedAt: '2026-07-05T00:00:00.000Z'
  }
};

test('builds empty restore preview for missing package', () => {
  const preview = buildRiccoRestorePreview(null);

  expect(preview.packageLooksValid).toBe(false);
  expect(preview.imageCount).toBe(0);
  expect(preview.loraSnapshotPresent).toBe(false);
  expect(preview.packageVersion).toBe('');
});

test('detects asset dataset and LoRA snapshot metadata from package', () => {
  const pkg = buildRiccoProductionPackage({
    images: [
      makeImage({ id: 'final', selected: true, assetStatus: 'approved_panel' }),
      makeImage({ id: 'fix', assetStatus: 'needs_fix' }),
      makeImage({ id: 'ref', assetStatus: 'reference_candidate', referenceCandidateType: 'character', referenceCandidateSubjectId: 'char_ricco', referenceCandidateNotes: 'good ref' }),
      makeImage({ id: 'candidate', assetStatus: 'dataset_candidate', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'caption' }),
      makeImage({ id: 'approved', assetStatus: 'approved_dataset', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'caption' })
    ],
    generationJobs: [makeJob()],
    referenceReviewState,
    generatedAt: '2026-07-05T00:00:00.000Z'
  });
  const parsed = parseRiccoProductionPackage(JSON.stringify(pkg));
  const preview = buildRiccoRestorePreview(parsed);

  expect(preview.packageLooksValid).toBe(true);
  expect(preview.packageVersion).toBe('ricco-production-package-v6');
  expect(preview.imageCount).toBe(5);
  expect(preview.finalImageCount).toBe(1);
  expect(preview.generationJobCount).toBe(1);
  expect(preview.referenceReviewCount).toBe(1);
  expect(preview.approvedReferenceCount).toBe(1);
  expect(preview.assetMetadataImageCount).toBe(5);
  expect(preview.referenceCandidateMetadataImageCount).toBe(1);
  expect(preview.datasetMetadataImageCount).toBe(2);
  expect(preview.datasetCandidateImageCount).toBe(1);
  expect(preview.approvedDatasetImageCount).toBe(1);
  expect(preview.needsFixImageCount).toBe(1);
  expect(preview.loraSnapshotPresent).toBe(true);
  expect(preview.loraNeedsWorkTargets).toBe(1);
  expect(preview.loraTotalApprovedItems).toBe(1);
});

test('builds readable restore status text', () => {
  const preview = buildRiccoRestorePreview({
    packageVersion: 'ricco-production-package-v6',
    reviewState: {
      storedImages: [makeImage({ id: 'approved', assetStatus: 'approved_dataset', datasetCandidateTargetType: 'character_lora', datasetCandidateTargetId: 'lora_char_ricco', datasetTriggerWord: 'ricco_rih', datasetCaption: 'caption' })]
    },
    loraPlanState: {
      readyTargets: 0,
      needsWorkTargets: 1,
      totalApprovedItems: 1
    }
  });

  expect(buildRiccoRestoreStatusText(preview)).toContain('1 Bilder');
  expect(buildRiccoRestoreStatusText(preview)).toContain('1 approved_dataset');
  expect(buildRiccoRestoreStatusText(preview)).toContain('LoRA Snapshot vorhanden');
});
