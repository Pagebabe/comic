import { expect, test } from '@playwright/test';
import { buildMinimalComfyUiPayload } from '../../src/lib/comfyui/comfyUiClient';
import type { GenerationJob } from '../../src/types/productionBackend';

function makeJob(input: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: input.id ?? 'job_001',
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: input.subjectId ?? 'panel_001',
    episodeId: input.episodeId ?? 'ep_001',
    panelId: input.panelId ?? 'panel_001',
    promptId: input.promptId ?? 'prompt_001',
    workflowId: input.workflowId ?? 'WF-006',
    workflowVersion: input.workflowVersion ?? 'v1',
    positivePrompt: input.positivePrompt ?? 'positive prompt text',
    negativePrompt: input.negativePrompt ?? 'negative prompt text',
    modelId: input.modelId ?? 'model_sdxl_comic_v1',
    loraIds: input.loraIds ?? ['ricco_rih_v1'],
    seed: input.seed ?? 100001,
    sampler: input.sampler ?? 'DPM++ 2M Karras',
    steps: input.steps ?? 30,
    cfg: input.cfg ?? 7,
    resolutionWidth: input.resolutionWidth ?? 1216,
    resolutionHeight: input.resolutionHeight ?? 832,
    batchSize: input.batchSize ?? 1,
    batchCount: input.batchCount ?? 4,
    outputPath: input.outputPath ?? '/generated/panel_001/',
    status: input.status ?? 'queued',
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-07-05T00:00:00.000Z',
    notes: input.notes
  };
}

test('builds minimal ComfyUI adapter payload from generation job identity', () => {
  const job = makeJob();
  const payload = buildMinimalComfyUiPayload(job);

  expect(payload.meta).toMatchObject({
    source: 'ricco-comic-factory',
    jobId: 'job_001',
    panelId: 'panel_001',
    promptId: 'prompt_001'
  });
  expect(payload.meta.warning).toContain('not a full ComfyUI graph');
  expect(payload.positivePrompt).toBe('positive prompt text');
  expect(payload.negativePrompt).toBe('negative prompt text');
});

test('preserves render settings in ComfyUI adapter payload', () => {
  const job = makeJob({
    workflowId: 'WF-TEST',
    modelId: 'comic_model',
    loraIds: ['a', 'b'],
    seed: 42,
    sampler: 'Euler a',
    steps: 22,
    cfg: 5.5,
    resolutionWidth: 1024,
    resolutionHeight: 768,
    batchSize: 2,
    batchCount: 3,
    outputPath: '/generated/test/'
  });
  const payload = buildMinimalComfyUiPayload(job);

  expect(payload.settings).toEqual({
    workflowId: 'WF-TEST',
    modelId: 'comic_model',
    loraIds: ['a', 'b'],
    seed: 42,
    sampler: 'Euler a',
    steps: 22,
    cfg: 5.5,
    width: 1024,
    height: 768,
    batchSize: 2,
    batchCount: 3,
    outputPath: '/generated/test/'
  });
});
