import { buildGenerationJobExport, createRiccoPanelGenerationJobs } from '../../lib/generation/createRiccoGenerationJobs';
import type { GenerationJob, GenerationJobStatus } from '../../types/productionBackend';

export type GenerationQueueReport = {
  completed: number;
  failed: number;
  active: number;
};

export type GenerationQueueMergeResult = {
  mergedJobs: GenerationJob[];
  addedCount: number;
  preservedCount: number;
};

export function generationJobStatusClass(status: GenerationJobStatus | string) {
  if (['completed_manual', 'imported_as_asset', 'api_completed'].includes(status)) return 'status-active';
  if (['failed', 'api_failed', 'cancelled'].includes(status)) return 'status-rejected';
  return 'status-needs_fix';
}

export function buildGenerationJobCopyText(job: GenerationJob) {
  return [
    `GENERATION JOB: ${job.id}`,
    `Panel: ${job.panelId ?? '-'}`,
    `Workflow: ${job.workflowId} / ${job.workflowVersion}`,
    `Output: ${job.outputPath}`,
    '',
    'POSITIVE PROMPT:',
    job.positivePrompt,
    '',
    'NEGATIVE PROMPT:',
    job.negativePrompt,
    '',
    'SETTINGS:',
    `model: ${job.modelId ?? '-'}`,
    `loras: ${job.loraIds.join(', ') || '-'}`,
    `seed: ${job.seed ?? '-'}`,
    `sampler: ${job.sampler}`,
    `steps: ${job.steps}`,
    `cfg: ${job.cfg}`,
    `resolution: ${job.resolutionWidth}x${job.resolutionHeight}`,
    `batch: ${job.batchSize}x${job.batchCount}`
  ].join('\n');
}

export function generationJobStableKey(job: GenerationJob) {
  return [job.episodeId ?? '-', job.panelId ?? job.subjectId ?? '-', job.promptId, job.workflowId, job.workflowVersion].join('::');
}

export function mergeGeneratedJobs(existingJobs: GenerationJob[], generatedJobs: GenerationJob[]): GenerationQueueMergeResult {
  const existingKeys = new Set(existingJobs.map(generationJobStableKey));
  const missingJobs = generatedJobs.filter((job) => !existingKeys.has(generationJobStableKey(job)));

  return {
    mergedJobs: [...existingJobs, ...missingJobs],
    addedCount: missingJobs.length,
    preservedCount: existingJobs.length
  };
}

export function createMissingRiccoGenerationJobs(existingJobs: GenerationJob[]) {
  return mergeGeneratedJobs(existingJobs, createRiccoPanelGenerationJobs());
}

export function summarizeGenerationQueue(jobs: GenerationJob[]): GenerationQueueReport {
  const completed = jobs.filter((job) => ['completed_manual', 'imported_as_asset', 'api_completed'].includes(job.status)).length;
  const failed = jobs.filter((job) => ['failed', 'api_failed', 'cancelled'].includes(job.status)).length;
  const active = jobs.length - completed - failed;

  return { completed, failed, active };
}

export function buildGenerationQueueJson(jobs: GenerationJob[]) {
  return JSON.stringify(buildGenerationJobExport(jobs), null, 2);
}
