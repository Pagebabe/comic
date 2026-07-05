import { expect, test } from '@playwright/test';
import {
  generationJobStableKey,
  mergeGeneratedJobs,
  summarizeGenerationQueue
} from '../../src/domain/generation/riccoGenerationQueue';
import type { GenerationJob } from '../../src/types/productionBackend';

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

test('builds stable keys from production identity fields', () => {
  const job = makeJob();
  expect(generationJobStableKey(job)).toBe('ep_001::panel_001::prompt_001::WF-006::v1');
});

test('merges generated jobs without overwriting existing matching jobs', () => {
  const existing = makeJob({ id: 'existing', status: 'completed_manual' });
  const duplicateGenerated = makeJob({ id: 'duplicate', status: 'queued' });
  const missingGenerated = makeJob({ id: 'missing', panelId: 'panel_002', subjectId: 'panel_002', promptId: 'prompt_002' });

  const result = mergeGeneratedJobs([existing], [duplicateGenerated, missingGenerated]);

  expect(result.addedCount).toBe(1);
  expect(result.preservedCount).toBe(1);
  expect(result.mergedJobs.map((job) => job.id)).toEqual(['existing', 'missing']);
  expect(result.mergedJobs[0].status).toBe('completed_manual');
});

test('summarizes completed failed and active queue jobs', () => {
  const report = summarizeGenerationQueue([
    makeJob({ id: 'a', status: 'completed_manual' }),
    makeJob({ id: 'b', status: 'imported_as_asset' }),
    makeJob({ id: 'c', status: 'failed' }),
    makeJob({ id: 'd', status: 'queued' })
  ]);

  expect(report).toEqual({ completed: 2, failed: 1, active: 1 });
});
