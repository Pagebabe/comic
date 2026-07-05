import { expect, test } from '@playwright/test';
import {
  buildLoraTrainingChecklist,
  buildLoraTrainingPlan,
  buildLoraTrainingTargetPlan,
  groupApprovedDatasetItemsByTarget,
  readinessLabel,
  requirementForTargetType,
  slugTrainingPath
} from '../../src/domain/training/riccoLoraTrainingPlan';
import { buildApprovedDatasetItems } from '../../src/domain/assets/riccoApprovedDatasetExport';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/dataset/ricco_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? 'prompt text',
    rating: input.rating ?? 5,
    continuityScore: input.continuityScore ?? 5,
    notes: input.notes ?? 'approved dataset image',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus ?? 'approved_dataset',
    assetStatusUpdatedAt: input.assetStatusUpdatedAt,
    datasetCandidateTargetType: input.datasetCandidateTargetType ?? 'character_lora',
    datasetCandidateTargetId: input.datasetCandidateTargetId ?? 'lora_char_ricco',
    datasetTriggerWord: input.datasetTriggerWord ?? 'ricco_rih',
    datasetCaption: input.datasetCaption ?? 'ricco_rih, clean face',
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

test('returns LoRA image requirements by target type', () => {
  expect(requirementForTargetType('character_lora')).toMatchObject({ minimumImages: 20, recommendedImages: 40 });
  expect(requirementForTargetType('location_lora')).toMatchObject({ minimumImages: 12, recommendedImages: 30 });
  expect(requirementForTargetType('style_lora')).toMatchObject({ minimumImages: 40, recommendedImages: 80 });
  expect(slugTrainingPath('LoRA Char Ricco')).toBe('lora-char-ricco');
});

test('groups approved dataset items by target', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'a', datasetCandidateTargetId: 'lora_char_ricco' }),
    makeImage({ id: 'b', datasetCandidateTargetId: 'lora_char_ricco' }),
    makeImage({ id: 'c', datasetCandidateTargetId: 'lora_char_basti', datasetTriggerWord: 'basti_rih' })
  ], [makeJob()]);
  const groups = groupApprovedDatasetItemsByTarget(items);

  expect(groups.get('lora_char_ricco')).toHaveLength(2);
  expect(groups.get('lora_char_basti')).toHaveLength(1);
});

test('marks target ready when minimum approved dataset items are valid', () => {
  const images = Array.from({ length: 20 }, (_, index) => makeImage({ id: `img_${index}`, imageUrl: `/dataset/ricco_${index}.png` }));
  const plan = buildLoraTrainingPlan(images, [], '2026-07-05T00:00:00.000Z');

  expect(plan.totalApprovedItems).toBe(20);
  expect(plan.readyTargets).toBe(1);
  expect(plan.needsWorkTargets).toBe(0);
  expect(plan.targets[0]).toMatchObject({ readiness: 'ready', readyItemCount: 20, minimumImages: 20, triggerWord: 'ricco_rih' });
});

test('marks target as needing more images below threshold', () => {
  const items = buildApprovedDatasetItems([makeImage({ id: 'one' })], []);
  const target = buildLoraTrainingTargetPlan('lora_char_ricco', items);

  expect(target.readiness).toBe('needs_more_images');
  expect(target.warnings).toContain('needs at least 20 ready images');
  expect(readinessLabel(target.readiness)).toBe('NEEDS MORE IMAGES');
});

test('marks target as needing metadata when trigger words conflict or item warnings exist', () => {
  const items = buildApprovedDatasetItems([
    makeImage({ id: 'a', datasetTriggerWord: 'ricco_rih' }),
    makeImage({ id: 'b', datasetTriggerWord: 'wrong_trigger' }),
    makeImage({ id: 'c', datasetCaption: '', rating: 2 })
  ], []);
  const target = buildLoraTrainingTargetPlan('lora_char_ricco', items);

  expect(target.readiness).toBe('needs_metadata');
  expect(target.warnings).toContain('inconsistent trigger words');
  expect(target.warnings.some((warning) => warning.includes('approved dataset items still have warnings'))).toBe(true);
});

test('builds useful target checklist', () => {
  const items = buildApprovedDatasetItems([makeImage({ id: 'a', imageUrl: '/dataset/ricco_001.png' })], []);
  const target = buildLoraTrainingTargetPlan('lora_char_ricco', items);
  const checklist = buildLoraTrainingChecklist(target);

  expect(checklist).toContain('LoRA Target: Ricco character LoRA');
  expect(checklist).toContain('Dataset folder: datasets/ricco/lora-char-ricco');
  expect(checklist).toContain('/dataset/ricco_001.txt');
});
